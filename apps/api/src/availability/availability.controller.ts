import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('shops/:shopId/barbers/:barberId/slots')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getSlots(
    @Param('shopId') shopId: string,
    @Param('barberId') barberId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.availabilityService.getSlots(shopId, barberId, date, serviceId);
  }
}
