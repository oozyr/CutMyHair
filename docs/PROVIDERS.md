# Provider Architecture and Extension Guide

CutMyHair API uses a modular provider pattern for external services (Payments, Geolocation, and OTP Delivery). Each provider is defined by an interface and wired via NestJS dependency injection. By default, mock implementations are active.

## 1. Provider Interfaces and Injection Tokens

| Provider | Interface Path | Injection Token | Default Mock |
|---|---|---|---|
| Payment | `src/providers/payment/payment.provider.interface.ts` | `PAYMENT_PROVIDER` | `MockPaymentProvider` |
| Geolocation | `src/providers/geo/geo.provider.interface.ts` | `GEO_PROVIDER` | `MockGeoProvider` |
| OTP Sender | `src/providers/otp/otp-sender.interface.ts` | `OTP_SENDER` | `MockOtpSender` |

All providers are registered globally in `apps/api/src/providers/providers.module.ts`.

---

## 2. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PAYMENT_PROVIDER` | `mock` or `billplz` | `mock` |
| `GEO_PROVIDER` | `mock` or `google` | `mock` |
| `OTP_PROVIDER` | `mock` or `resend` | `mock` |
| `BILLPLZ_BASE_URL` | Billplz API base URL | `https://www.billplz-sandbox.com/api/v3` |
| `BILLPLZ_SECRET_KEY` | Billplz Secret Key | none |
| `BILLPLZ_XSIGNATURE_KEY` | Billplz X-Signature Key | none |
| `BILLPLZ_COLLECTION_ID` | Billplz Collection ID | none |
| `PUBLIC_API_URL` | Public API URL for payment webhooks and callbacks | `http://localhost:3000/api` |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API key | none |
| `RESEND_API_KEY` | Resend API key for email OTP delivery | none |

---

## 3. How to Plug in a Real Provider

To add a real provider without rewriting existing code:

### Example: Adding a Real Billplz Payment Provider
1. Create `apps/api/src/providers/payment/billplz-payment.provider.ts`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import {
     PaymentProvider,
     CreatePaymentParams,
     CreatePaymentResult,
     PaymentStatus,
     RefundResult,
     WebhookResult,
   } from './payment.provider.interface';

   @Injectable()
   export class BillplzPaymentProvider implements PaymentProvider {
     async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
       // Call Billplz API POST /bills using process.env.BILLPLZ_SECRET_KEY
       // Return { paymentId: bill.id, paymentUrl: bill.url, status: 'pending' }
     }

     async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
       // Call Billplz API GET /bills/:id and map state
     }

     async refund(paymentId: string, amountSen?: number): Promise<RefundResult> {
       // Call Billplz refund endpoint or record refund
     }

     async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
       // Verify X-Signature and update payment status
     }
   }
   ```
2. Update the provider factory in `apps/api/src/providers/providers.module.ts`:
   ```typescript
   {
     provide: PAYMENT_PROVIDER,
     useFactory: () => {
       const isBillplz = process.env.PAYMENT_PROVIDER === 'billplz';
       const hasKeys = process.env.BILLPLZ_SECRET_KEY && process.env.BILLPLZ_COLLECTION_ID;
       return isBillplz && hasKeys ? new BillplzPaymentProvider() : new MockPaymentProvider();
     },
   }
   ```
3. Set `PAYMENT_PROVIDER=billplz` and supply the required API keys in `.env`.

### Fail-safe Fallback
On server startup, `ProvidersModule` evaluates requested providers against required environment variables. If any required keys are missing, the API logs a warning and automatically falls back to the mock provider without crashing.

---

## 4. Google Maps on Mobile (app.config.js)

In Expo Go, `GOOGLE_MAPS_API_KEY` is not required because the app uses the default map provider. The key is only read by `app.config.js` into `android.config.googleMaps.apiKey` and `ios.config.googleMapsApiKey` for standalone development or production builds. If the key is omitted, the app starts normally and renders maps with the default provider.

Android API key restrictions (package name and SHA-1 certificate fingerprint) will be configured in the Google Cloud Console once standalone Android builds are generated.
