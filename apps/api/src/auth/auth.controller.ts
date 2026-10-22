import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('status')
  status() {
    return { status: 'Auth module stub. OTP and Google login coming soon.' };
  }
}
