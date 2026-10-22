import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import type { Review } from '@cutmyhair/shared';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly store: StoreService) {}

  create(dto: CreateReviewDto): Review {
    const { shopId, customerId, bookingId, rating, comment } = dto;

    // Only customers with a completed booking at this shop can review
    const booking = this.store.bookings.get(bookingId);
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.status !== 'completed') {
      throw new BadRequestException(
        'You can only review a shop after completing a booking there',
      );
    }
    if (booking.shopId !== shopId) {
      throw new BadRequestException('Booking does not belong to this shop');
    }
    if (booking.customerId !== customerId) {
      throw new BadRequestException('Booking does not belong to this customer');
    }

    // Prevent duplicate reviews per booking
    const existing = Array.from(this.store.reviews.values()).find(
      (r) => r.bookingId === bookingId,
    );
    if (existing) {
      throw new BadRequestException('A review already exists for this booking');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const id = `rev-${Date.now()}`;
    const review: Review = {
      id,
      shopId,
      customerId,
      bookingId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    this.store.reviews.set(id, review);
    return review;
  }

  findByShop(shopId: string): Review[] {
    return Array.from(this.store.reviews.values())
      .filter((r) => r.shopId === shopId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
