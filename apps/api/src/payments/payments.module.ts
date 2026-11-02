import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BookingsModule, AuthModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
