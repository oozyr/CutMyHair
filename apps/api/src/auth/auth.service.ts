import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StoreService } from '../store/store.service';
import { OTP_SENDER } from '../providers/otp/otp.tokens';
import type { OtpSender } from '../providers/otp/otp-sender.interface';
import type { Customer } from '@cutmyhair/shared';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateMeDto } from './dto/update-me.dto';

export function normalizeMalaysianPhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new BadRequestException('A valid Malaysian mobile phone number is required');
  }
  const cleaned = rawPhone.replace(/[\s\-]/g, '');
  const match = cleaned.match(/^(\+?60|0)(\d{9,10})$/);
  if (!match) {
    throw new BadRequestException(
      'Invalid Malaysian mobile phone number. Format should be +601x-xxxxxxx or 01x-xxxxxxx',
    );
  }
  return `+60${match[2]}`;
}

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly otpStore = new Map<string, OtpRecord>();

  constructor(
    private readonly store: StoreService,
    @Inject(OTP_SENDER) private readonly otpSender: OtpSender,
  ) {}

  private getAuthSecret(): string {
    return process.env.AUTH_SECRET || 'dev-auth-secret-key-cutmyhair';
  }

  async requestOtp(
    email: string,
  ): Promise<{ success: boolean; isNewUser: boolean; message: string }> {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    const fixedOtp = process.env.DEV_FIXED_OTP?.trim();
    const code = fixedOtp && fixedOtp.length > 0
      ? fixedOtp
      : Math.floor(100000 + Math.random() * 900000).toString();

    // 10 minute expiry window, resets attempt counter
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.otpStore.set(normalizedEmail, {
      code,
      expiresAt,
      attempts: 0,
    });

    await this.otpSender.send(normalizedEmail, code);

    const existingCustomer = Array.from(this.store.customers.values()).find(
      (c) => c.email.toLowerCase() === normalizedEmail,
    );

    return {
      success: true,
      isNewUser: !existingCustomer,
      message: 'OTP verification code sent',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ token: string; customer: Customer }> {
    if (!dto.email || !dto.code) {
      throw new BadRequestException('Email and verification code are required');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const record = this.otpStore.get(normalizedEmail);

    if (!record || Date.now() > record.expiresAt) {
      this.otpStore.delete(normalizedEmail);
      throw new BadRequestException('OTP code has expired or was not requested. Please request a new code.');
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      this.otpStore.delete(normalizedEmail);
      throw new BadRequestException('Too many invalid attempts. Please request a new verification code.');
    }

    if (dto.code.trim() !== record.code) {
      const remaining = 5 - record.attempts;
      throw new BadRequestException(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Look up or create customer
    let customer = Array.from(this.store.customers.values()).find(
      (c) => c.email.toLowerCase() === normalizedEmail,
    );

    if (customer) {
      customer.emailVerified = true;
      if (dto.name && !customer.name) {
        customer.name = dto.name.trim();
      }
      if (dto.phone && !customer.phone) {
        customer.phone = normalizeMalaysianPhone(dto.phone);
      }
      if (dto.preferences) {
        customer.preferences = {
          ...(customer.preferences || {}),
          ...dto.preferences,
        };
      }
    } else {
      if (!dto.name || !dto.name.trim()) {
        throw new BadRequestException('Name is required for new registration');
      }
      if (!dto.phone || !dto.phone.trim()) {
        throw new BadRequestException('Phone number is required for new registration');
      }
      const normalizedPhone = normalizeMalaysianPhone(dto.phone);
      customer = {
        id: `cust-${Date.now()}`,
        name: dto.name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        emailVerified: true,
        consentAcceptedAt: new Date().toISOString(),
        preferences: {
          preferredLanguage: dto.preferences?.preferredLanguage || 'ms',
          favoriteServiceTypes: dto.preferences?.favoriteServiceTypes || [],
        },
        createdAt: new Date().toISOString(),
      };
      this.store.customers.set(customer.id, customer);
    }

    // Code is valid and customer resolved: clear OTP record
    this.otpStore.delete(normalizedEmail);

    const token = this.createSessionToken(customer.id, customer.email);

    return {
      token,
      customer,
    };
  }

  async updateMe(
    customerId: string,
    dto: UpdateMeDto,
  ): Promise<{ customer: Customer }> {
    const customer = this.store.customers.get(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestException('Name cannot be empty');
      }
      customer.name = trimmed;
    }

    if (dto.phone !== undefined) {
      customer.phone = normalizeMalaysianPhone(dto.phone);
    }

    if (dto.preferences !== undefined) {
      customer.preferences = {
        ...(customer.preferences || {}),
        ...dto.preferences,
      };
    }

    return { customer };
  }

  createSessionToken(customerId: string, email: string): string {
    const payload = {
      sub: customerId,
      email,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getAuthSecret())
      .update(payloadStr)
      .digest('base64url');

    return `${payloadStr}.${signature}`;
  }

  verifySessionToken(token: string): Customer {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing authentication token');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid authentication token format');
    }

    const [payloadStr, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', this.getAuthSecret())
      .update(payloadStr)
      .digest('base64url');

    if (signature !== expectedSig) {
      throw new UnauthorizedException('Invalid authentication token signature');
    }

    let payload: { sub?: string; email?: string; exp?: number };
    try {
      payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Malformed token payload');
    }

    if (!payload?.sub || !payload?.exp || Date.now() > payload.exp) {
      throw new UnauthorizedException('Session token has expired');
    }

    const customer = this.store.customers.get(payload.sub);
    if (!customer) {
      throw new UnauthorizedException('Customer associated with token was not found');
    }

    return customer;
  }
}
