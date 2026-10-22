import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('shopId') shopId?: string,
    @Query('barberId') barberId?: string,
  ) {
    return this.bookingsService.findAll({ customerId, shopId, barberId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status);
  }

  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleBookingDto) {
    return this.bookingsService.reschedule(id, dto.startTime);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
