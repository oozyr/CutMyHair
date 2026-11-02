import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('radius') radius?: string,
  ) {
    const centerLat = lat ? parseFloat(lat) : 3.139;
    const centerLng = lng ? parseFloat(lng) : 101.6869;
    const radiusParam = radiusKm !== undefined ? radiusKm : radius;
    const parsedRadius = radiusParam !== undefined ? parseFloat(radiusParam) : 10;
    const validRadius = Number.isFinite(parsedRadius) ? Math.min(Math.max(parsedRadius, 0), 10) : 10;
    return this.shopsService.findAll(centerLat, centerLng, validRadius);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }
}
