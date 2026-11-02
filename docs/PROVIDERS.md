# Provider Architecture and Extension Guide

CutMyHair API uses a modular provider pattern for external services (Payments, Geolocation, and OTP Delivery). Each provider is defined by an interface and wired via NestJS dependency injection. By default, mock implementations are active.

## 1. Provider Interfaces and Injection Tokens

| Provider | Interface Path | Injection Token | Default Mock | Real Implementation |
|---|---|---|---|---|
| Payment | `src/providers/payment/payment.provider.interface.ts` | `PAYMENT_PROVIDER` | `MockPaymentProvider` | `BillplzPaymentProvider` |
| Geolocation | `src/providers/geo/geo.provider.interface.ts` | `GEO_PROVIDER` | `MockGeoProvider` | `GoogleGeoProvider` |
| OTP Sender | `src/providers/otp/otp-sender.interface.ts` | `OTP_SENDER` | `MockOtpSender` | `ResendOtpSender` |

All providers are registered globally in `apps/api/src/providers/providers.module.ts`.

---

## 2. Environment Variables

| Variable | Description | Recommended Value |
|---|---|---|
| `PAYMENT_PROVIDER` | `mock` or `billplz` | `mock` (or `billplz` when keys present) |
| `GEO_PROVIDER` | `mock` or `google` | `mock` |
| `OTP_PROVIDER` | `mock` or `resend` | `mock` |
| `BILLPLZ_BASE_URL` | Billplz API base URL | `https://www.billplz-sandbox.com/api` |
| `BILLPLZ_SECRET_KEY` | Billplz Secret Key | none |
| `BILLPLZ_XSIGNATURE_KEY` | Billplz X-Signature Key | none |
| `BILLPLZ_COLLECTION_ID` | Billplz Collection ID | none |
| `PUBLIC_API_URL` | Public API URL for payment webhooks and callbacks | `http://localhost:3000/api` |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API key | none |
| `RESEND_API_KEY` | Resend API key for email OTP delivery | none |

---

## 3. Payment Gateway Implementations

### Existing: BillplzPaymentProvider
`BillplzPaymentProvider` is implemented at `apps/api/src/providers/payment/billplz-payment.provider.ts`.
It creates bills via `POST /v3/bills`, verifies callback HMAC signatures with `BILLPLZ_XSIGNATURE_KEY`, and checks bill status via `GET /v3/bills/:id`. It is automatically selected when `PAYMENT_PROVIDER=billplz` and all four `BILLPLZ_` environment variables are present. The provider accepts `BILLPLZ_BASE_URL` with or without a trailing slash and with or without a `/v3` path segment.

### Adding a Different Payment Gateway in the Future
To add a new payment gateway without modifying existing business logic:

1. Create a new provider file implementing `PaymentProvider`:
   `apps/api/src/providers/payment/your-gateway-payment.provider.ts`
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
   export class YourGatewayPaymentProvider implements PaymentProvider {
     async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
       // Call gateway API to initiate transaction
       // Return { paymentId, paymentUrl, status: 'pending' }
     }

     async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
       // Query gateway status and return 'pending', 'paid', or 'failed'
     }

     async refund(paymentId: string, amountSen?: number): Promise<RefundResult> {
       // Call gateway refund API
     }

     async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
       // Verify webhook signature and return parsed status
     }
   }
   ```

2. Register the gateway in `apps/api/src/providers/providers.module.ts`:
   Update the factory function for `PAYMENT_PROVIDER` to check `process.env.PAYMENT_PROVIDER === 'your-gateway'` and verify required gateway credentials.

3. Configure gateway environment variables in `.env` and `.env.example`.

### Fail-safe Fallback
On server startup, `ProvidersModule` evaluates requested providers against required environment variables. If any required keys are missing, the API logs a warning and automatically falls back to the mock provider without crashing.

---

## 4. Google Maps on Mobile (app.config.js)

In Expo Go, `GOOGLE_MAPS_API_KEY` is not required because the app uses the default map provider. The key is only read by `app.config.js` into `android.config.googleMaps.apiKey` and `ios.config.googleMapsApiKey` for standalone development or production builds. If the key is omitted, the app starts normally and renders maps with the default provider.

Android API key restrictions (package name and SHA-1 certificate fingerprint) will be configured in the Google Cloud Console once standalone Android builds are generated.
