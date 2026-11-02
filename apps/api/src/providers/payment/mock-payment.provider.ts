import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatus,
  RefundResult,
  WebhookResult,
} from './payment.provider.interface';

interface StoredMockPayment {
  paymentId: string;
  bookingId: string;
  amountSen: number;
  customerEmail: string;
  customerName: string;
  status: PaymentStatus;
  createdAt: string;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);
  private readonly payments = new Map<string, StoredMockPayment>();

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const paymentId = `mock-bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const publicUrl = process.env.PUBLIC_API_URL || 'http://localhost:3000/api';
    const paymentUrl = `${publicUrl}/payments/mock-checkout/${paymentId}`;

    this.payments.set(paymentId, {
      paymentId,
      bookingId: params.bookingId,
      amountSen: params.amountSen,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`Created mock payment ${paymentId} for booking ${params.bookingId} (${params.amountSen} sen)`);

    return {
      paymentId,
      paymentUrl,
      status: 'pending',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = this.payments.get(paymentId);
    return payment ? payment.status : 'pending';
  }

  async refund(paymentId: string, _amountSen?: number): Promise<RefundResult> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, message: 'Payment record not found' };
    }
    payment.status = 'refunded';
    this.logger.log(`Refunded mock payment ${paymentId}`);
    return { success: true };
  }

  async handleWebhook(payload: any, _signature?: string): Promise<WebhookResult> {
    const paymentId = payload?.paymentId || payload?.id;
    const requestedStatus: PaymentStatus = payload?.status === 'paid' ? 'paid' : 'failed';

    const existing = this.payments.get(paymentId);
    if (existing) {
      existing.status = requestedStatus;
    }

    this.logger.log(`Handled webhook for mock payment ${paymentId}: ${requestedStatus}`);

    return {
      paymentId,
      bookingId: existing?.bookingId,
      status: requestedStatus,
      raw: payload,
    };
  }

  async markAsPaid(paymentId: string): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return false;
    }
    payment.status = 'paid';
    this.logger.log(`Manually marked mock payment ${paymentId} as paid`);
    return true;
  }
}
