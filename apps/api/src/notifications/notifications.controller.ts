import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Query('customerId') customerId: string) {
    if (!customerId) {
      return [];
    }
    return this.notificationsService.getForCustomer(customerId);
  }
}
