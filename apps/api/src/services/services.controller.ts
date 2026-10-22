import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('shops/:shopId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findByShop(@Param('shopId') shopId: string) {
    return this.servicesService.findByShop(shopId);
  }

  @Get(':id')
  findOne(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.servicesService.findOne(shopId, id);
  }
}
