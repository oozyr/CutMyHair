import { API_BASE_URL } from '../config/env';
import type {
  Shop,
  Barber,
  Service,
  Booking,
  Review,
  AvailabilitySlot,
} from '@cutmyhair/shared';

export type ShopWithDistance = Shop & {
  distanceKm?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
};

export interface GetShopsParams {
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface CreateBookingPayload {
  customerId: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  startTime: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  async getShops(params?: GetShopsParams): Promise<ShopWithDistance[]> {
    const query = new URLSearchParams();
    if (params?.lat !== undefined) query.set('lat', String(params.lat));
    if (params?.lng !== undefined) query.set('lng', String(params.lng));
    if (params?.radius !== undefined) query.set('radius', String(params.radius));
    const qs = query.toString();
    return request<ShopWithDistance[]>(`/shops${qs ? `?${qs}` : ''}`);
  },

  async getShop(id: string): Promise<Shop> {
    return request<Shop>(`/shops/${id}`);
  },

  async getBarbers(shopId: string): Promise<Barber[]> {
    return request<Barber[]>(`/shops/${shopId}/barbers`);
  },

  async getServices(shopId: string): Promise<Service[]> {
    return request<Service[]>(`/shops/${shopId}/services`);
  },

  async getSlots(
    shopId: string,
    barberId: string,
    date: string,
    serviceId?: string,
  ): Promise<AvailabilitySlot[]> {
    const query = new URLSearchParams({ date });
    if (serviceId) query.set('serviceId', serviceId);
    return request<AvailabilitySlot[]>(
      `/shops/${shopId}/barbers/${barberId}/slots?${query.toString()}`,
    );
  },

  async getBookings(customerId?: string): Promise<Booking[]> {
    const qs = customerId ? `?customerId=${customerId}` : '';
    return request<Booking[]>(`/bookings${qs}`);
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async rescheduleBooking(id: string, startTime: string): Promise<Booking> {
    return request<Booking>(`/bookings/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ startTime }),
    });
  },

  async cancelBooking(id: string): Promise<Booking> {
    return request<Booking>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  async getReviews(shopId: string): Promise<Review[]> {
    return request<Review[]>(`/shops/${shopId}/reviews`);
  },
};
