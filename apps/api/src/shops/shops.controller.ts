import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const centerLat = lat ? parseFloat(lat) : 3.139;
    const centerLng = lng ? parseFloat(lng) : 101.6869;
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.shopsService.findAll(centerLat, centerLng, radiusKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }
}
