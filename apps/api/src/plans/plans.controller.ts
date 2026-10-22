import { Controller, Get } from '@nestjs/common';

@Controller('plans')
export class PlansController {
  @Get()
  stub() {
    return {
      plans: [
        { id: 'base', name: 'Base', priceMonthly: 29, currency: 'MYR' },
        { id: 'pro', name: 'Pro', priceMonthly: 49, currency: 'MYR' },
      ],
      status: 'Plan management coming soon.',
    };
  }
}
