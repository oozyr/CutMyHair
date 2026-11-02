import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, CustomerAuthGuard],
  exports: [AuthService, CustomerAuthGuard],
})
export class AuthModule {}
