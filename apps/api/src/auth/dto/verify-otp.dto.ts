import type { CustomerPreferences } from '@cutmyhair/shared';

export class VerifyOtpDto {
  email!: string;
  code!: string;
  name?: string;
  phone?: string;
  preferences?: CustomerPreferences;
}
