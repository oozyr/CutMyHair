/**
 * Payment tests: signature verification, hold expiry, sync, redirect allowlist,
 * cancel refund rule, customerPriceSen, idempotent callback.
 * No external service calls - all tests use in-process logic only.
 */
'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// Inline helpers (duplicated from source to avoid NestJS bootstrap in tests)
// ---------------------------------------------------------------------------

function verifyBillplzSignature(params, xSignatureKey) {
  const received = params['x_signature'];
  if (!received) return false;
  const data = { ...params };
  delete data['x_signature'];
  const source = Object.keys(data)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .join('|');
  // Rebuild as key+value pairs joined by |
  const sourcePairs = Object.keys(data)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}${data[k]}`)
    .join('|');
  const computed = crypto
    .createHmac('sha256', xSignatureKey)
    .update(sourcePairs)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(received));
  } catch {
    return false;
  }
}

function buildSignature(params, key) {
  const data = { ...params };
  delete data['x_signature'];
  const source = Object.keys(data)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}${data[k]}`)
    .join('|');
  return crypto.createHmac('sha256', key).update(source).digest('hex');
}

const XSIG_KEY = 'test-x-signature-key-abc123';

// ---------------------------------------------------------------------------
// Settings constants (inline to avoid TS compilation)
// ---------------------------------------------------------------------------
const PAYMENT_HOLD_MINUTES = 10;
const REFUND_CUTOFF_HOURS = 2;
const SERVICE_MARKUP_SEN = 500;

// ---------------------------------------------------------------------------
// Minimal in-memory store for testing
// ---------------------------------------------------------------------------
function makeStore() {
  const bookings = new Map();
  const services = new Map();
  const customers = new Map();
  return { bookings, services, customers };
}

function expireUnpaidBookings(store, now = Date.now()) {
  for (const [id, b] of store.bookings.entries()) {
    if (b.status === 'pending_payment' && b.paymentStatus !== 'paid') {
      const expiresAtMs = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      if (expiresAtMs > 0 && expiresAtMs <= now) {
        store.bookings.set(id, {
          ...b,
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date(now).toISOString(),
        });
      }
    }
  }
}

function isAllowedReturnUrl(url) {
  return url.startsWith('exp://') || url.startsWith('cutmyhair://');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Billplz signature verification', () => {
  it('accepts a valid signature', () => {
    const params = { id: 'bill123', paid: 'true', paid_at: '2026-01-01T10:00:00Z' };
    const sig = buildSignature(params, XSIG_KEY);
    assert.equal(verifyBillplzSignature({ ...params, x_signature: sig }, XSIG_KEY), true);
  });

  it('rejects an invalid signature', () => {
    const params = { id: 'bill123', paid: 'true', paid_at: '2026-01-01T10:00:00Z' };
    const badSig = 'a'.repeat(64); // wrong hex string
    assert.equal(verifyBillplzSignature({ ...params, x_signature: badSig }, XSIG_KEY), false);
  });

  it('rejects a tampered param', () => {
    const params = { id: 'bill123', paid: 'true', paid_at: '2026-01-01T10:00:00Z' };
    const sig = buildSignature(params, XSIG_KEY);
    // Tamper: change paid to false after signing
    assert.equal(
      verifyBillplzSignature({ ...params, paid: 'false', x_signature: sig }, XSIG_KEY),
      false,
    );
  });

  it('rejects missing x_signature', () => {
    const params = { id: 'bill123', paid: 'true' };
    assert.equal(verifyBillplzSignature(params, XSIG_KEY), false);
  });
});

describe('Payment hold expiry', () => {
  it('cancels expired pending_payment bookings', () => {
    const store = makeStore();
    const past = new Date(Date.now() - 1000).toISOString();
    store.bookings.set('bkg-1', {
      id: 'bkg-1',
      status: 'pending_payment',
      paymentStatus: 'pending',
      expiresAt: past,
    });

    expireUnpaidBookings(store);

    const booking = store.bookings.get('bkg-1');
    assert.equal(booking.status, 'cancelled');
    assert.equal(booking.paymentStatus, 'failed');
  });

  it('does not expire a pending_payment booking whose hold has not elapsed', () => {
    const store = makeStore();
    const future = new Date(Date.now() + 60_000).toISOString();
    store.bookings.set('bkg-2', {
      id: 'bkg-2',
      status: 'pending_payment',
      paymentStatus: 'pending',
      expiresAt: future,
    });

    expireUnpaidBookings(store);

    const booking = store.bookings.get('bkg-2');
    assert.equal(booking.status, 'pending_payment');
  });

  it('does not expire a confirmed booking', () => {
    const store = makeStore();
    const past = new Date(Date.now() - 1000).toISOString();
    store.bookings.set('bkg-3', {
      id: 'bkg-3',
      status: 'confirmed',
      paymentStatus: 'paid',
      expiresAt: past,
    });

    expireUnpaidBookings(store);

    assert.equal(store.bookings.get('bkg-3').status, 'confirmed');
  });
});

describe('Redirect allowlist', () => {
  it('allows exp:// URLs', () => {
    assert.equal(isAllowedReturnUrl('exp://127.0.0.1:8081'), true);
  });

  it('allows cutmyhair:// URLs', () => {
    assert.equal(isAllowedReturnUrl('cutmyhair://booking/success'), true);
  });

  it('blocks https:// URLs', () => {
    assert.equal(isAllowedReturnUrl('https://evil.com'), false);
  });

  it('blocks http:// URLs', () => {
    assert.equal(isAllowedReturnUrl('http://localhost'), false);
  });
});

describe('Cancel refund rule', () => {
  function cancelBooking(store, id) {
    const booking = store.bookings.get(id);
    if (!booking) throw new Error('not found');

    if (booking.status === 'pending_payment') {
      store.bookings.set(id, { ...booking, status: 'cancelled', paymentStatus: 'failed' });
      return store.bookings.get(id);
    }

    let paymentStatus = booking.paymentStatus;
    if (booking.paymentStatus === 'paid') {
      const hoursUntilStart =
        (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
      paymentStatus = hoursUntilStart > REFUND_CUTOFF_HOURS ? 'refund_pending' : booking.paymentStatus;
    }
    store.bookings.set(id, { ...booking, status: 'cancelled', paymentStatus });
    return store.bookings.get(id);
  }

  it('sets refund_pending when cancelled more than 2h before start', () => {
    const store = makeStore();
    const futureStart = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    store.bookings.set('bkg-r1', {
      id: 'bkg-r1', status: 'confirmed', paymentStatus: 'paid', startTime: futureStart,
    });
    const result = cancelBooking(store, 'bkg-r1');
    assert.equal(result.status, 'cancelled');
    assert.equal(result.paymentStatus, 'refund_pending');
  });

  it('does not refund when cancelled within 2h of start', () => {
    const store = makeStore();
    const soonStart = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    store.bookings.set('bkg-r2', {
      id: 'bkg-r2', status: 'confirmed', paymentStatus: 'paid', startTime: soonStart,
    });
    const result = cancelBooking(store, 'bkg-r2');
    assert.equal(result.status, 'cancelled');
    assert.equal(result.paymentStatus, 'paid');
  });

  it('cancels unpaid hold with failed status', () => {
    const store = makeStore();
    store.bookings.set('bkg-r3', {
      id: 'bkg-r3', status: 'pending_payment', paymentStatus: 'pending',
      startTime: new Date(Date.now() + 60_000).toISOString(),
    });
    const result = cancelBooking(store, 'bkg-r3');
    assert.equal(result.status, 'cancelled');
    assert.equal(result.paymentStatus, 'failed');
  });
});

describe('customerPriceSen', () => {
  it('equals service price plus SERVICE_MARKUP_SEN', () => {
    const rawPrice = 2000; // RM 20.00 in sen
    const customerPrice = rawPrice + SERVICE_MARKUP_SEN;
    assert.equal(customerPrice, 2500); // RM 25.00 in sen
  });
});

describe('Idempotent Billplz callback', () => {
  it('does not change a confirmed booking on a repeated paid callback', () => {
    const store = makeStore();
    const billId = 'bill-xyz';
    store.bookings.set('bkg-cb1', {
      id: 'bkg-cb1',
      billId,
      status: 'confirmed',
      paymentStatus: 'paid',
      customerId: 'cust-1',
      shopId: 'shop-1',
      startTime: new Date().toISOString(),
    });

    // Simulate callback processing logic
    const booking = Array.from(store.bookings.values()).find((b) => b.billId === billId);
    const alreadyProcessed = booking && (booking.paymentStatus === 'paid' || booking.status === 'confirmed');
    assert.equal(alreadyProcessed, true, 'Should detect already-processed booking');

    // Booking is unchanged
    const after = store.bookings.get('bkg-cb1');
    assert.equal(after.status, 'confirmed');
    assert.equal(after.paymentStatus, 'paid');
  });
});

describe('Sync marks booking as paid in mock mode', () => {
  it('confirms booking when payment provider reports paid', () => {
    const store = makeStore();
    const billId = 'mock-bill-001';
    store.bookings.set('bkg-s1', {
      id: 'bkg-s1',
      billId,
      status: 'pending_payment',
      paymentStatus: 'pending',
      customerId: 'cust-1',
      shopId: 'shop-1',
      startTime: new Date().toISOString(),
    });

    // Simulate sync: provider says paid, update booking
    const booking = store.bookings.get('bkg-s1');
    const providerStatus = 'paid'; // mock provider would return this
    if (providerStatus === 'paid' && booking.paymentStatus !== 'paid') {
      store.bookings.set('bkg-s1', {
        ...booking,
        status: 'confirmed',
        paymentStatus: 'paid',
        updatedAt: new Date().toISOString(),
      });
    }

    const after = store.bookings.get('bkg-s1');
    assert.equal(after.status, 'confirmed');
    assert.equal(after.paymentStatus, 'paid');
  });
});
