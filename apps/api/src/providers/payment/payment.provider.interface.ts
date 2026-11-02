export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CreatePaymentParams {
  bookingId: string;
  amountSen: number;
  customerEmail: string;
  customerName: string;
  description: string;
  callbackUrl?: string;
  redirectUrl?: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  paymentUrl: string;
  status: PaymentStatus;
}

export interface WebhookResult {
  paymentId: string;
  bookingId?: string;
  status: PaymentStatus;
  raw: any;
}

export interface RefundResult {
  success: boolean;
  message?: string;
}

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  refund(paymentId: string, amountSen?: number): Promise<RefundResult>;
  handleWebhook(payload: any, signature?: string): Promise<WebhookResult>;
  markAsPaid?(paymentId: string): Promise<boolean>;
}
