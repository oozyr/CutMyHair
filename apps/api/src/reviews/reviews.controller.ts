import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import type { Customer } from '@cutmyhair/shared';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(CustomerAuthGuard)
  create(
    @Body() dto: CreateReviewDto,
    @CurrentCustomer() customer: Customer,
  ) {
    return this.reviewsService.create({
      ...dto,
      customerId: customer.id,
    });
  }

  @Get('shops/:shopId/reviews')
  findByShop(@Param('shopId') shopId: string) {
    return this.reviewsService.findByShop(shopId);
  }
}
