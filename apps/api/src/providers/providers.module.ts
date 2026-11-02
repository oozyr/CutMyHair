import { Global, Module, OnModuleInit } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment/payment.tokens';
import { MockPaymentProvider } from './payment/mock-payment.provider';
import { GEO_PROVIDER } from './geo/geo.tokens';
import { MockGeoProvider } from './geo/mock-geo.provider';
import { OTP_SENDER } from './otp/otp.tokens';
import { MockOtpSender } from './otp/mock-otp.sender';

@Global()
@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useClass: MockPaymentProvider,
    },
    {
      provide: GEO_PROVIDER,
      useClass: MockGeoProvider,
    },
    {
      provide: OTP_SENDER,
      useClass: MockOtpSender,
    },
  ],
  exports: [PAYMENT_PROVIDER, GEO_PROVIDER, OTP_SENDER],
})
export class ProvidersModule implements OnModuleInit {
  onModuleInit() {
    this.checkAndLogProviders();
  }

  private checkAndLogProviders(): void {
    // 1. Payment Provider
    const requestedPayment = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
    const billplzKeys = [
      'BILLPLZ_BASE_URL',
      'BILLPLZ_SECRET_KEY',
      'BILLPLZ_XSIGNATURE_KEY',
      'BILLPLZ_COLLECTION_ID',
    ];
    const missingBillplz = billplzKeys.filter((k) => !process.env[k]);

    if (requestedPayment === 'billplz') {
      if (missingBillplz.length > 0) {
        console.log(
          `[Provider] Payment: mock (active) - requested 'billplz' but missing keys: ${missingBillplz.join(', ')}`,
        );
      } else {
        console.log(`[Provider] Payment: billplz (active)`);
      }
    } else {
      console.log(`[Provider] Payment: mock (active)`);
    }

    // 2. Geo Provider
    const requestedGeo = (process.env.GEO_PROVIDER || 'mock').toLowerCase();
    const geoKeys = ['GOOGLE_MAPS_API_KEY'];
    const missingGeo = geoKeys.filter((k) => !process.env[k]);

    if (requestedGeo === 'google') {
      if (missingGeo.length > 0) {
        console.log(
          `[Provider] Geo: mock (active) - requested 'google' but missing keys: ${missingGeo.join(', ')}`,
        );
      } else {
        console.log(`[Provider] Geo: google (active)`);
      }
    } else {
      console.log(`[Provider] Geo: mock (active)`);
    }

    // 3. OTP Provider
    const requestedOtp = (process.env.OTP_PROVIDER || 'mock').toLowerCase();
    const otpKeys = ['RESEND_API_KEY'];
    const missingOtp = otpKeys.filter((k) => !process.env[k]);

    if (requestedOtp === 'resend') {
      if (missingOtp.length > 0) {
        console.log(
          `[Provider] OTP: mock (active) - requested 'resend' but missing keys: ${missingOtp.join(', ')}`,
        );
      } else {
        console.log(`[Provider] OTP: resend (active)`);
      }
    } else {
      console.log(`[Provider] OTP: mock (active)`);
    }
  }
}
