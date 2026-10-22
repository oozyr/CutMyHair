import { Controller, Get, Param } from '@nestjs/common';
import { BarbersService } from './barbers.service';

@Controller('shops/:shopId/barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Get()
  findByShop(@Param('shopId') shopId: string) {
    return this.barbersService.findByShop(shopId);
  }

  @Get(':id')
  findOne(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.barbersService.findOne(shopId, id);
  }
}
