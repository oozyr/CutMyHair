import { Controller, Get } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
  @Get()
  stub() {
    return { status: 'Notifications stub. In-app push coming soon.' };
  }
}
