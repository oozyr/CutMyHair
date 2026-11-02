import { API_BASE_URL } from '../config/env';
import type {
  Shop,
  Barber,
  Service,
  Booking,
  Review,
  AvailabilitySlot,
  Customer,
  CustomerPreferences,
} from '@cutmyhair/shared';

export interface AppNotification {
  id: string;
  customerId: string;
  type: 'booking_made' | 'booking_cancelled' | 'booking_rescheduled';
  bookingId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ShopWithDistance = Shop & {
  distanceKm?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  minPriceSen?: number | null;
  maxPriceSen?: number | null;
  openNow?: boolean;
  kind?: 'shop' | 'freelance';
};

export interface GetShopsParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  radius?: number;
}

export interface CreateBookingPayload {
  customerId?: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  startTime: string;
  paymentMethod?: string;
}

let currentAuthToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function setOnUnauthorized(callback: (() => void) | null) {
  unauthorizedHandler = callback;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Auth endpoints
  async requestOtp(email: string): Promise<{ success: boolean; isNewUser: boolean; message: string }> {
    return request<{ success: boolean; isNewUser: boolean; message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(payload: {
    email: string;
    code: string;
    name?: string;
    phone?: string;
    preferences?: CustomerPreferences;
  }): Promise<{ token: string; customer: Customer }> {
    return request<{ token: string; customer: Customer }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<{ customer: Customer }> {
    return request<{ customer: Customer }>('/auth/me');
  },

  async updateMe(payload: {
    name?: string;
    phone?: string;
    preferences?: CustomerPreferences;
  }): Promise<{ customer: Customer }> {
    return request<{ customer: Customer }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Public shop & barber endpoints
  async getShops(params?: GetShopsParams): Promise<ShopWithDistance[]> {
    const query = new URLSearchParams();
    if (params?.lat !== undefined) query.set('lat', String(params.lat));
    if (params?.lng !== undefined) query.set('lng', String(params.lng));
    if (params?.radiusKm !== undefined) {
      query.set('radiusKm', String(params.radiusKm));
    } else if (params?.radius !== undefined) {
      query.set('radius', String(params.radius));
    }
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

  // Protected customer bookings
  async getBookings(customerId?: string): Promise<Booking[]> {
    const qs = customerId ? `?customerId=${customerId}` : '';
    return request<Booking[]>(`/bookings${qs}`);
  },

  async getBooking(id: string): Promise<Booking> {
    return request<Booking>(`/bookings/${id}`);
  },

  async getCheckInCode(bookingId: string): Promise<{ code: string; payload: string }> {
    return request<{ code: string; payload: string }>(`/bookings/${bookingId}/check-in-code`);
  },

  async checkIn(bookingId: string, code: string): Promise<Booking> {
    return request<Booking>(`/bookings/${bookingId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
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

  async createReview(payload: {
    shopId: string;
    customerId?: string;
    bookingId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    return request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getNotifications(customerId?: string): Promise<AppNotification[]> {
    const qs = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return request<AppNotification[]>(`/notifications${qs}`);
  },

  async markAllNotificationsRead(customerId?: string): Promise<{ success: boolean }> {
    const qs = customerId ? `?customerId=${encodeURIComponent(customerId)}` : '';
    return request<{ success: boolean }>(`/notifications/read-all${qs}`, {
      method: 'POST',
    });
  },

  async startPayment(bookingId: string): Promise<{ paymentUrl: string; paymentId: string }> {
    return request<{ paymentUrl: string; paymentId: string }>(
      `/payments/${bookingId}/start`,
      { method: 'POST' },
    );
  },

  async syncPayment(bookingId: string): Promise<{ status: string; bookingStatus: string }> {
    return request<{ status: string; bookingStatus: string }>(
      `/payments/${bookingId}/sync`,
      { method: 'POST' },
    );
  },
};
