import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BookingsService } from '../bookings/bookings.service';
import { StoreService } from '../store/store.service';
import { PAYMENT_PROVIDER } from '../providers/payment/payment.tokens';
import type { PaymentProvider } from '../providers/payment/payment.provider.interface';
import { MockPaymentProvider } from '../providers/payment/mock-payment.provider';
import { verifyBillplzSignature } from '../providers/payment/billplz-signature';

const ALLOWED_RETURN_PREFIXES = ['exp://', 'cutmyhair://'];

function isAllowedReturnUrl(url: string): boolean {
  return ALLOWED_RETURN_PREFIXES.some((prefix) => url.startsWith(prefix));
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly store: StoreService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  /**
   * POST /api/payments/:bookingId/start
   * Initiates payment for a pending_payment booking.
   * Returns { paymentUrl, paymentId }.
   */
  @Post(':bookingId/start')
  async start(@Param('bookingId') bookingId: string) {
    const booking = this.bookingsService.findOne(bookingId);
    if (booking.status !== 'pending_payment') {
      throw new BadRequestException(
        `Booking is not in pending_payment state (current: ${booking.status})`,
      );
    }

    const customer = this.store.customers.get(booking.customerId);
    const customerName = customer?.name ?? 'Customer';
    const customerEmail = customer?.email ?? 'customer@demo.com';

    const publicUrl = process.env.PUBLIC_API_URL || 'http://localhost:3000/api';
    const callbackUrl = `${publicUrl}/payments/billplz/callback`;
    const redirectUrl = `${publicUrl}/payments/return`;

    const result = await this.paymentProvider.createPayment({
      bookingId,
      amountSen: booking.customerTotalSen,
      customerName,
      customerEmail,
      description: `Haircut booking #${bookingId}`,
      paymentMethod: booking.paymentMethod,
      callbackUrl,
      redirectUrl,
    });

    // Store bill details on booking
    const updated = this.store.bookings.get(bookingId);
    if (updated) {
      this.store.bookings.set(bookingId, {
        ...updated,
        billId: result.paymentId,
        billUrl: result.paymentUrl,
        updatedAt: new Date().toISOString(),
      });
    }

    return { paymentUrl: result.paymentUrl, paymentId: result.paymentId };
  }

  /**
   * POST /api/payments/:bookingId/sync
   * Polls the payment provider for the current status and updates booking.
   */
  @Post(':bookingId/sync')
  async sync(@Param('bookingId') bookingId: string) {
    const booking = this.bookingsService.findOne(bookingId);
    if (!booking.billId) {
      throw new BadRequestException('No payment has been started for this booking');
    }

    const status = await this.paymentProvider.getPaymentStatus(booking.billId);

    if (status === 'paid' && booking.paymentStatus !== 'paid') {
      this.bookingsService.confirmPayment(bookingId, booking.billId, booking.billUrl);
      return { status: 'paid', bookingStatus: 'confirmed' };
    }

    if (status === 'failed' && booking.paymentStatus !== 'failed') {
      const updated = this.store.bookings.get(bookingId);
      if (updated) {
        this.store.bookings.set(bookingId, {
          ...updated,
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
        });
      }
      return { status: 'failed', bookingStatus: 'cancelled' };
    }

    return { status, bookingStatus: booking.status };
  }

  /**
   * POST /api/payments/billplz/callback
   * Receives form-encoded callback from Billplz. Verifies x_signature.
   */
  @Post('billplz/callback')
  async billplzCallback(@Body() body: Record<string, string>) {
    const xKey = process.env.BILLPLZ_XSIGNATURE_KEY;
    if (!xKey) {
      // In mock mode, the Billplz callback is not used - ignore gracefully
      return { received: true };
    }

    const valid = verifyBillplzSignature(body, xKey);
    if (!valid) {
      // Return 401 via exception
      throw new UnauthorizedException('Invalid x_signature');
    }

    const billId = body['id'];
    const isPaid = body['paid'] === 'true';

    if (!billId) {
      return { received: true };
    }

    // Find the booking by billId
    const booking = Array.from(this.store.bookings.values()).find(
      (b) => b.billId === billId,
    );
    if (!booking) {
      return { received: true };
    }

    // Idempotent: if already processed, do nothing
    if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
      return { received: true };
    }

    if (isPaid) {
      this.bookingsService.confirmPayment(booking.id, billId);
    } else {
      this.store.bookings.set(booking.id, {
        ...booking,
        status: 'cancelled',
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      });
    }

    return { received: true };
  }

  /**
   * GET /api/payments/return
   * Redirect landing page after Billplz payment.
   * Only allows exp:// and cutmyhair:// redirect targets.
   */
  @Get('return')
  returnPage(@Query('returnUrl') returnUrl: string, @Res() res: Response) {
    if (returnUrl && isAllowedReturnUrl(returnUrl)) {
      return res.redirect(302, returnUrl);
    }
    // Show a static page for unknown or missing return URLs
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CutMyHair - Return to App</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
.card{background:#fff;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:320px}
h1{color:#333;font-size:1.2rem}p{color:#666}</style></head>
<body><div class="card">
<h1>Payment complete</h1>
<p>Please return to the CutMyHair app to view your booking.</p>
</div></body></html>`);
  }

  /**
   * GET /api/payments/mock/:paymentId
   * Mock checkout page with Pay and Fail buttons for sandbox testing.
   */
  @Get('mock/:paymentId')
  mockCheckout(@Param('paymentId') paymentId: string, @Res() res: Response) {
    const publicUrl = process.env.PUBLIC_API_URL || 'http://localhost:3000/api';
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CutMyHair - Mock Checkout</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f0f0}
.card{background:#fff;padding:2rem;border-radius:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:360px;width:100%}
h1{color:#333;font-size:1.3rem;margin-bottom:0.5rem}
p{color:#555;font-size:0.9rem}
.pill{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.75rem;margin-bottom:1.5rem}
.btn{display:block;width:100%;padding:0.75rem;border:none;border-radius:8px;font-size:1rem;cursor:pointer;margin-bottom:0.75rem}
.pay{background:#4caf50;color:#fff}.fail{background:#f44336;color:#fff}
</style></head>
<body><div class="card">
<h1>Mock Payment</h1>
<span class="pill">SANDBOX MODE</span>
<p>Payment ID: <code>${paymentId}</code></p>
<p>Choose an outcome to simulate payment processing:</p>
<form method="POST" action="${publicUrl}/payments/mock/${paymentId}/pay">
  <button class="btn pay" type="submit">Pay (simulate success)</button>
</form>
<form method="POST" action="${publicUrl}/payments/mock/${paymentId}/fail">
  <button class="btn fail" type="submit">Fail (simulate failure)</button>
</form>
</div></body></html>`);
  }

  /**
   * POST /api/payments/mock/:paymentId/pay
   * Simulates a successful payment (mock mode only).
   */
  @Post('mock/:paymentId/pay')
  async mockPay(@Param('paymentId') paymentId: string, @Res() res: Response) {
    if (!(this.paymentProvider instanceof MockPaymentProvider)) {
      throw new BadRequestException('Mock endpoints are only available in mock mode');
    }

    const payment = this.paymentProvider.getPayment(paymentId);
    if (!payment) {
      throw new NotFoundException(`Mock payment ${paymentId} not found`);
    }

    // Idempotent
    if (payment.status !== 'paid') {
      this.paymentProvider.markAsPaid(paymentId);
      const booking = Array.from(this.store.bookings.values()).find(
        (b) => b.billId === paymentId,
      );
      if (booking && booking.paymentStatus !== 'paid') {
        this.bookingsService.confirmPayment(booking.id, paymentId);
      }
    }

    const returnUrl = payment.returnUrl;
    if (returnUrl && isAllowedReturnUrl(returnUrl)) {
      return res.redirect(302, returnUrl);
    }
    return res.status(200).send('Payment successful. Return to the app.');
  }

  /**
   * POST /api/payments/mock/:paymentId/fail
   * Simulates a failed payment (mock mode only).
   */
  @Post('mock/:paymentId/fail')
  async mockFail(@Param('paymentId') paymentId: string, @Res() res: Response) {
    if (!(this.paymentProvider instanceof MockPaymentProvider)) {
      throw new BadRequestException('Mock endpoints are only available in mock mode');
    }

    const payment = this.paymentProvider.getPayment(paymentId);
    if (!payment) {
      throw new NotFoundException(`Mock payment ${paymentId} not found`);
    }

    if (payment.status !== 'failed') {
      this.paymentProvider.markAsFailed(paymentId);
      const booking = Array.from(this.store.bookings.values()).find(
        (b) => b.billId === paymentId,
      );
      if (booking && booking.status === 'pending_payment') {
        this.store.bookings.set(booking.id, {
          ...booking,
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const returnUrl = payment.returnUrl;
    if (returnUrl && isAllowedReturnUrl(returnUrl)) {
      return res.redirect(302, returnUrl);
    }
    return res.status(200).send('Payment failed. Return to the app.');
  }
}
