import { Controller, Get } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  @Get()
  stub() {
    return { status: 'Analytics coming soon.' };
  }
}
