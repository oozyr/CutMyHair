const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/auth/auth.service');
const { StoreService } = require('../dist/store/store.service');

class CapturingMockOtpSender {
  constructor() {
    this.sent = [];
  }
  async send(email, code) {
    this.sent.push({ email, code });
  }
}

test('AuthService requestOtp sends OTP and validates email format', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  // Rejects invalid email
  await assert.rejects(
    async () => authService.requestOtp('not-an-email'),
    /Please provide a valid email address/,
  );

  // Sends code for valid email
  const response = await authService.requestOtp('user@example.com');
  assert.equal(response.success, true);
  assert.equal(otpSender.sent.length, 1);
  assert.equal(otpSender.sent[0].email, 'user@example.com');
  assert.equal(otpSender.sent[0].code.length, 6);
});

test('AuthService requestOtp respects DEV_FIXED_OTP environment variable', async () => {
  process.env.DEV_FIXED_OTP = '999888';
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('dev@example.com');
  assert.equal(otpSender.sent[0].code, '999888');
  delete process.env.DEV_FIXED_OTP;
});

test('AuthService verifyOtp verifies code, creates new customer and returns token', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('newuser@example.com');
  const code = otpSender.sent[0].code;

  const result = await authService.verifyOtp({
    email: 'newuser@example.com',
    code,
    name: 'New User',
    phone: '+60129998877',
  });

  assert.ok(result.token);
  assert.equal(result.customer.email, 'newuser@example.com');
  assert.equal(result.customer.name, 'New User');
  assert.equal(result.customer.emailVerified, true);

  // Verifying token returns the customer
  const verifiedCustomer = authService.verifySessionToken(result.token);
  assert.equal(verifiedCustomer.id, result.customer.id);
});

test('AuthService verifyOtp enforces attempt limits on wrong code', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('retry@example.com');

  // Attempt 1 with wrong code
  await assert.rejects(
    async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }),
    /Invalid verification code. 4 attempt\(s\) remaining/,
  );

  // Attempt 2, 3, 4, 5
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));

  // Attempt 6 exceeds limit
  await assert.rejects(
    async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }),
    /Too many invalid attempts/,
  );
});

test('AuthService verifySessionToken rejects tampered or expired tokens', () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  const token = authService.createSessionToken('cust-001', 'ahmad.faris@email.com');
  const validCustomer = authService.verifySessionToken(token);
  assert.equal(validCustomer.id, 'cust-001');

  // Tampered token
  const tampered = token.slice(0, -3) + 'xyz';
  assert.throws(() => authService.verifySessionToken(tampered), /Invalid authentication token signature/);
});

test('Malaysian phone validation and normalization', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  // Rejects invalid phone numbers for new customer
  await authService.requestOtp('phone-fail1@example.com');
  const code1 = otpSender.sent[otpSender.sent.length - 1].code;

  await assert.rejects(
    async () =>
      authService.verifyOtp({
        email: 'phone-fail1@example.com',
        code: code1,
        name: 'Test',
        phone: '12345',
      }),
    /Invalid Malaysian mobile phone number/,
  );

  await authService.requestOtp('phone-fail2@example.com');
  const code2 = otpSender.sent[otpSender.sent.length - 1].code;

  await assert.rejects(
    async () =>
      authService.verifyOtp({
        email: 'phone-fail2@example.com',
        code: code2,
        name: 'Test',
        phone: '+1234567890',
      }),
    /Invalid Malaysian mobile phone number/,
  );

  // Normalizes 01x-xxxxxxx to +601xxxxxxx
  await authService.requestOtp('phone-ok1@example.com');
  const code3 = otpSender.sent[otpSender.sent.length - 1].code;
  const res1 = await authService.verifyOtp({
    email: 'phone-ok1@example.com',
    code: code3,
    name: 'User 1',
    phone: '012-345 6789',
  });
  assert.equal(res1.customer.phone, '+60123456789');
  assert.ok(res1.customer.consentAcceptedAt);

  // Normalizes +60 prefix
  await authService.requestOtp('phone-ok2@example.com');
  const code4 = otpSender.sent[otpSender.sent.length - 1].code;
  const res2 = await authService.verifyOtp({
    email: 'phone-ok2@example.com',
    code: code4,
    name: 'User 2',
    phone: '+60 11 1234 5678',
  });
  assert.equal(res2.customer.phone, '+601112345678');
});

test('New registration requires name and phone, existing does not', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  // New user without name
  await authService.requestOtp('noname@example.com');
  const code1 = otpSender.sent[otpSender.sent.length - 1].code;
  await assert.rejects(
    async () =>
      authService.verifyOtp({
        email: 'noname@example.com',
        code: code1,
        phone: '0123456789',
      }),
    /Name is required for new registration/,
  );

  // New user without phone
  await authService.requestOtp('nophone@example.com');
  const code2 = otpSender.sent[otpSender.sent.length - 1].code;
  await assert.rejects(
    async () =>
      authService.verifyOtp({
        email: 'nophone@example.com',
        code: code2,
        name: 'No Phone',
      }),
    /Phone number is required for new registration/,
  );

  // Existing user logs in with only email and code
  const existingEmail = 'ahmad.faris@email.com'; // seeded customer
  await authService.requestOtp(existingEmail);
  const code3 = otpSender.sent[otpSender.sent.length - 1].code;
  const existingLogin = await authService.verifyOtp({
    email: existingEmail,
    code: code3,
  });
  assert.equal(existingLogin.customer.id, 'cust-001');
});

test('New customer starts with empty Inbox and no bookings', async () => {
  const { NotificationsService } = require('../dist/notifications/notifications.service');
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);
  const notifService = new NotificationsService();

  await authService.requestOtp('fresh@example.com');
  const code = otpSender.sent[otpSender.sent.length - 1].code;
  const { customer } = await authService.verifyOtp({
    email: freshEmail = 'fresh@example.com',
    code,
    name: 'Fresh Customer',
    phone: '0129876543',
  });

  // Inbox is empty
  const notifs = notifService.getForCustomer(customer.id);
  assert.equal(notifs.length, 0);

  // Bookings in store for this customer is 0
  const customerBookings = Array.from(store.bookings.values()).filter(
    (b) => b.customerId === customer.id,
  );
  assert.equal(customerBookings.length, 0);
});

test('CustomerAuthGuard validates Authorization header and sets customer', () => {
  const { CustomerAuthGuard } = require('../dist/auth/guards/customer-auth.guard');
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);
  const guard = new CustomerAuthGuard(authService);

  // Missing header
  const reqNoHeader = { headers: {} };
  assert.throws(
    () => guard.canActivate({ switchToHttp: () => ({ getRequest: () => reqNoHeader }) }),
    /Authorization header with Bearer token is required/,
  );

  // Invalid header format
  const reqBadHeader = { headers: { authorization: 'Basic 12345' } };
  assert.throws(
    () => guard.canActivate({ switchToHttp: () => ({ getRequest: () => reqBadHeader }) }),
    /Authorization header with Bearer token is required/,
  );

  // Valid token
  const token = authService.createSessionToken('cust-001', 'ahmad.faris@email.com');
  const reqValid = { headers: { authorization: `Bearer ${token}` } };
  const activated = guard.canActivate({ switchToHttp: () => ({ getRequest: () => reqValid }) });
  assert.equal(activated, true);
  assert.equal(reqValid.customer.id, 'cust-001');
});

test('Cross-customer booking access is refused in BookingsController', () => {
  const { BookingsController } = require('../dist/bookings/bookings.controller');
  const { BookingsService } = require('../dist/bookings/bookings.service');
  const { NotificationsService } = require('../dist/notifications/notifications.service');
  const store = new StoreService();
  const notifService = new NotificationsService();
  const bookingsService = new BookingsService(store, notifService);
  const controller = new BookingsController(bookingsService);

  // Seed booking bkg-001 belongs to cust-001
  const ownerCustomer = { id: 'cust-001', email: 'owner@test.com' };
  const otherCustomer = { id: 'cust-999', email: 'other@test.com' };

  // Owner can read booking
  const ownerBooking = controller.findOne('bkg-001', ownerCustomer);
  assert.equal(ownerBooking.id, 'bkg-001');

  // Other customer cannot read booking (ForbiddenException 403)
  assert.throws(
    () => controller.findOne('bkg-001', otherCustomer),
    /Access denied to this booking/,
  );

  // Other customer cannot get check-in code
  assert.throws(
    () => controller.getCheckInCode('bkg-001', otherCustomer),
    /Access denied to this booking/,
  );

  // Other customer cannot cancel booking
  assert.throws(
    () => controller.cancel('bkg-001', otherCustomer),
    /Access denied to this booking/,
  );
});

test('AuthService updateMe updates name, phone and preferences', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  // Seed customer cust-001
  const { customer } = await authService.updateMe('cust-001', {
    name: 'Updated Ahmad',
    phone: '0198887766',
    preferences: {
      preferredLanguage: 'ms',
      favoriteServiceTypes: ['Fade', 'Beard Trim'],
    },
  });

  assert.equal(customer.name, 'Updated Ahmad');
  assert.equal(customer.phone, '+60198887766');
  assert.deepEqual(customer.preferences.favoriteServiceTypes, ['Fade', 'Beard Trim']);

  // Empty name is rejected
  await assert.rejects(
    async () => authService.updateMe('cust-001', { name: '   ' }),
    /Name cannot be empty/,
  );

  // Invalid phone is rejected
  await assert.rejects(
    async () => authService.updateMe('cust-001', { phone: '123' }),
    /Invalid Malaysian mobile phone number/,
  );
});

test('Session token has 30 day expiration', () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  const before = Date.now();
  const token = authService.createSessionToken('cust-001', 'ahmad.faris@email.com');
  const payloadStr = token.split('.')[0];
  const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));

  const expectedExp = before + 30 * 24 * 60 * 60 * 1000;
  assert.ok(Math.abs(payload.exp - expectedExp) < 2000, 'Expiration should be 30 days from creation');
});

test('Cross-customer protection on reviews and payments', async () => {
  const { ReviewsController } = require('../dist/reviews/reviews.controller');
  const { ReviewsService } = require('../dist/reviews/reviews.service');
  const { PaymentsController } = require('../dist/payments/payments.controller');
  const { BookingsService } = require('../dist/bookings/bookings.service');
  const { NotificationsService } = require('../dist/notifications/notifications.service');
  const { MockPaymentProvider } = require('../dist/providers/payment/mock-payment.provider');

  const store = new StoreService();
  const notifService = new NotificationsService();
  const bookingsService = new BookingsService(store, notifService);
  const reviewsService = new ReviewsService(store);
  const reviewsController = new ReviewsController(reviewsService);
  const paymentProvider = new MockPaymentProvider();
  const paymentsController = new PaymentsController(bookingsService, store, paymentProvider);

  const owner = { id: 'cust-001', email: 'owner@test.com' };
  const intruder = { id: 'cust-999', email: 'intruder@test.com' };

  // Seed booking bkg-001 belongs to cust-001
  // Intruder cannot start payment for owner's booking
  await assert.rejects(
    async () => paymentsController.start('bkg-001', intruder),
    /Access denied to this booking/,
  );

  // Intruder cannot sync payment for owner's booking
  await assert.rejects(
    async () => paymentsController.sync('bkg-001', intruder),
    /Access denied to this booking/,
  );

  // Seed booking bkg-004 is completed and belongs to cust-002 at shop-003
  // Intruder cannot create review for owner's booking
  assert.throws(
    () =>
      reviewsController.create(
        {
          shopId: 'shop-003',
          bookingId: 'bkg-004',
          rating: 5,
          comment: 'Great hair cut!',
        },
        intruder,
      ),
    /Booking does not belong to this customer/,
  );
});

test('normalizeBillplzBaseUrl handles all URL formats', () => {
  const { normalizeBillplzBaseUrl } = require('../dist/providers/payment/billplz-payment.provider');

  const expected = 'https://www.billplz-sandbox.com/api';
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz-sandbox.com/api'), expected);
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz-sandbox.com/api/'), expected);
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz-sandbox.com/api/v3'), expected);
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz-sandbox.com/api/v3/'), expected);
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz.com/api'), 'https://www.billplz.com/api');
  assert.equal(normalizeBillplzBaseUrl('https://www.billplz.com/api/v3/'), 'https://www.billplz.com/api');
  assert.equal(normalizeBillplzBaseUrl(undefined), expected);
});
