import type { CustomerPreferences } from '@cutmyhair/shared';

export class UpdateMeDto {
  name?: string;
  phone?: string;
  preferences?: CustomerPreferences;
}
