import { Injectable, Logger } from '@nestjs/common';
import { OtpSender } from './otp-sender.interface';

@Injectable()
export class MockOtpSender implements OtpSender {
  private readonly logger = new Logger(MockOtpSender.name);

  async send(email: string, code: string): Promise<void> {
    // Print code directly to server console as requested
    console.log(`[OTP Mock] Sending OTP code ${code} to ${email}`);
    this.logger.log(`[OTP Mock] Dispatched verification code ${code} to ${email}`);
  }
}
