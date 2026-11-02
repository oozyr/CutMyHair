import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import type { Customer } from '@cutmyhair/shared';

@Controller('notifications')
@UseGuards(CustomerAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentCustomer() customer: Customer) {
    return this.notificationsService.getForCustomer(customer.id);
  }

  @Post('read-all')
  markAllRead(@CurrentCustomer() customer: Customer) {
    this.notificationsService.markAllRead(customer.id);
    return { success: true };
  }
}
