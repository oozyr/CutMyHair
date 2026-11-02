import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatus,
  RefundResult,
  WebhookResult,
} from './payment.provider.interface';
import { verifyBillplzSignature } from './billplz-signature';

@Injectable()
export class BillplzPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(BillplzPaymentProvider.name);

  private get baseUrl(): string {
    return process.env.BILLPLZ_BASE_URL || 'https://www.billplz-sandbox.com/api';
  }

  private get secretKey(): string {
    return process.env.BILLPLZ_SECRET_KEY || '';
  }

  private get xSignatureKey(): string {
    return process.env.BILLPLZ_XSIGNATURE_KEY || '';
  }

  private get collectionId(): string {
    return process.env.BILLPLZ_COLLECTION_ID || '';
  }

  private authHeader(): string {
    // Basic auth: secret key as username, empty password
    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const body = new URLSearchParams();
    body.set('collection_id', this.collectionId);
    body.set('email', params.customerEmail);
    body.set('name', params.customerName);
    body.set('amount', String(params.amountSen));
    body.set('description', params.description);
    if (params.callbackUrl) {
      body.set('callback_url', params.callbackUrl);
    }
    if (params.redirectUrl) {
      body.set('redirect_url', params.redirectUrl);
    }
    // For FPX, record the chosen method so it is stored on the booking.
    // Billplz pre-selection requires a specific bank code we do not have at this point,
    // so we append auto_submit=true to the bill URL to skip the method selection landing page.
    // The Billplz page shows its own method selection; this is acceptable for the sandbox demo.
    if (params.paymentMethod === 'fpx') {
      body.set('reference_1_label', 'Payment Method');
      body.set('reference_1', 'FPX');
    }

    const res = await fetch(`${this.baseUrl}/v3/bills`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Billplz createPayment failed: ${res.status} - response body omitted for security`);
      throw new Error(`Billplz bill creation failed with status ${res.status}`);
    }

    const data = await res.json() as { id: string; url: string };
    const paymentUrl = `${data.url}?auto_submit=true`;

    this.logger.log(`Created Billplz bill ${data.id} for booking ${params.bookingId}`);

    return {
      paymentId: data.id,
      paymentUrl,
      status: 'pending',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const res = await fetch(`${this.baseUrl}/v3/bills/${paymentId}`, {
      headers: { Authorization: this.authHeader() },
    });

    if (!res.ok) {
      this.logger.error(`Billplz getPaymentStatus failed: ${res.status}`);
      return 'pending';
    }

    const data = await res.json() as { paid: boolean; paid_at?: string | null };
    return data.paid ? 'paid' : 'pending';
  }

  async refund(_paymentId: string, _amountSen?: number): Promise<RefundResult> {
    // Billplz refunds require a manual process via the dashboard.
    // Mark as refund_pending and log for the ops team to action.
    this.logger.log(`Refund requested for Billplz bill ${_paymentId} - marking refund_pending, manual action required`);
    return { success: true, message: 'Refund pending - action required via Billplz dashboard' };
  }

  async handleWebhook(
    payload: Record<string, string>,
    _signature?: string,
  ): Promise<WebhookResult> {
    const xKey = this.xSignatureKey;
    const valid = verifyBillplzSignature(payload, xKey);

    if (!valid) {
      this.logger.warn('Billplz webhook received with invalid x_signature');
      return { paymentId: '', bookingId: undefined, status: 'failed', raw: payload };
    }

    const paymentId = payload['id'] || '';
    const isPaid = payload['paid'] === 'true';
    const status: PaymentStatus = isPaid ? 'paid' : 'failed';

    this.logger.log(`Billplz webhook: bill ${paymentId} status=${status}`);

    return { paymentId, bookingId: undefined, status, raw: payload };
  }
}
