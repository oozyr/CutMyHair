import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import type { Customer } from '@cutmyhair/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  status() {
    return { status: 'Auth service operational. Email OTP authentication active.' };
  }

  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  getCurrentCustomer(@CurrentCustomer() customer: Customer) {
    return { customer };
  }

  @Patch('me')
  @UseGuards(CustomerAuthGuard)
  updateCurrentCustomer(
    @CurrentCustomer() customer: Customer,
    @Body() dto: UpdateMeDto,
  ) {
    return this.authService.updateMe(customer.id, dto);
  }
}
