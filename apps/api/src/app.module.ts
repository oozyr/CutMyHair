import { Module } from '@nestjs/common';
import { StoreModule } from './store/store.module';
import { ShopsModule } from './shops/shops.module';
import { BarbersModule } from './barbers/barbers.module';
import { ServicesModule } from './services/services.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PlansModule } from './plans/plans.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    StoreModule,
    ShopsModule,
    BarbersModule,
    ServicesModule,
    AvailabilityModule,
    BookingsModule,
    ReviewsModule,
    AuthModule,
    PaymentsModule,
    AnalyticsModule,
    PlansModule,
    NotificationsModule,
  ],
})
export class AppModule {}
