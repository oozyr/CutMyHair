import { Controller, Get } from '@nestjs/common';
import { PLAN_LIST } from '@cutmyhair/shared';

@Controller('plans')
export class PlansController {
  @Get()
  getPlans() {
    return {
      plans: PLAN_LIST,
    };
  }
}
