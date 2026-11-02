import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
