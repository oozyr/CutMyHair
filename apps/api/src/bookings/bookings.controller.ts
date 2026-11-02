import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import type { Customer } from '@cutmyhair/shared';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(CustomerAuthGuard)
  create(
    @Body() dto: CreateBookingDto,
    @CurrentCustomer() customer: Customer,
  ) {
    return this.bookingsService.create({
      ...dto,
      customerId: customer.id,
    });
  }

  @Get()
  @UseGuards(CustomerAuthGuard)
  findAll(
    @CurrentCustomer() customer: Customer,
    @Query('shopId') shopId?: string,
    @Query('barberId') barberId?: string,
  ) {
    return this.bookingsService.findAll({
      customerId: customer.id,
      shopId,
      barberId,
    });
  }

  @Get(':id')
  @UseGuards(CustomerAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentCustomer() customer: Customer,
  ) {
    const booking = this.bookingsService.findOne(id);
    if (booking.customerId !== customer.id) {
      throw new ForbiddenException('Access denied to this booking');
    }
    return booking;
  }

  @Get(':id/check-in-code')
  @UseGuards(CustomerAuthGuard)
  getCheckInCode(
    @Param('id') id: string,
    @CurrentCustomer() customer: Customer,
  ) {
    const booking = this.bookingsService.findOne(id);
    if (booking.customerId !== customer.id) {
      throw new ForbiddenException('Access denied to this booking');
    }
    return this.bookingsService.getCheckInCode(id);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Body() dto: CheckInDto) {
    return this.bookingsService.checkIn(id, dto.code);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status);
  }

  @Patch(':id/reschedule')
  @UseGuards(CustomerAuthGuard)
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentCustomer() customer: Customer,
  ) {
    const booking = this.bookingsService.findOne(id);
    if (booking.customerId !== customer.id) {
      throw new ForbiddenException('Access denied to this booking');
    }
    return this.bookingsService.reschedule(id, dto.startTime);
  }

  @Delete(':id')
  @UseGuards(CustomerAuthGuard)
  cancel(
    @Param('id') id: string,
    @CurrentCustomer() customer: Customer,
  ) {
    const booking = this.bookingsService.findOne(id);
    if (booking.customerId !== customer.id) {
      throw new ForbiddenException('Access denied to this booking');
    }
    return this.bookingsService.cancel(id);
  }
}
