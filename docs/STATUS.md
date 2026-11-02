# CutMyHair Project Status

## 1. Folder Map
- `apps/api`: NestJS modular monolith REST API serving seeded in-memory Cheras data.
- `apps/mobile`: Expo React Native mobile app for customers (browse, book, check-in, inbox).
- `apps/web`: Next.js PWA web dashboard for barbers (currently an MVP skeleton landing page).
- `packages/shared`: Shared TypeScript types, design tokens, seed data, and slot calculation logic.
- `legacy`: Previous Flutter and Firebase implementation, reference only (never run or modify).
- `docs`: Product specifications, architectural audit, status documentation, and provider guides.

## 2. apps/api Endpoints and Modules
All routes use the global `/api` prefix.

### Real Modules
- `GET /api/shops`: List shops within radius (default 10km of Cheras lat/lng) with distance and price ranges.
- `GET /api/shops/:id`: Get details for a single shop.
- `GET /api/shops/:shopId/barbers`: List barbers for a shop.
- `GET /api/shops/:shopId/barbers/:id`: Get details for a specific barber.
- `GET /api/shops/:shopId/services`: List services offered by a shop.
- `GET /api/shops/:shopId/services/:id`: Get details for a specific service.
- `GET /api/shops/:shopId/barbers/:barberId/slots`: Calculate 30-minute available slots for a barber on a date.
- `POST /api/bookings`: Create a booking with calculated fees and markup, validate slot conflicts, and emit a notification.
- `GET /api/bookings`: List bookings filtered by customerId, shopId, or barberId.
- `GET /api/bookings/:id`: Get a booking by ID.
- `GET /api/bookings/:id/check-in-code`: Generate 6-char HMAC check-in code and payload string.
- `POST /api/bookings/:id/check-in`: Validate 6-char code and time window (-60m to end time), update status to checked_in.
- `PATCH /api/bookings/:id/status`: Update booking status.
- `PATCH /api/bookings/:id/reschedule`: Reschedule booking time slot, validate conflicts, and emit notification.
- `DELETE /api/bookings/:id`: Cancel booking and emit cancellation notification.
- `POST /api/reviews`: Submit a review for a completed booking (checks customer ID and duplicate review).
- `GET /api/shops/:shopId/reviews`: Get all reviews for a shop.
- `GET /api/notifications`: Get customer notifications (newest first).
- `POST /api/notifications/read-all`: Mark all notifications as read for a customer.
- `POST /api/auth/request-otp`: Request 6-digit email OTP (supports DEV_FIXED_OTP, expires in 10 minutes, max 5 attempts).
- `POST /api/auth/verify-otp`: Verify OTP code, create/update customer record, return signed session token.
- `GET /api/auth/me`: Get authenticated customer via CustomerAuthGuard.
- `GET /api/plans`: Returns real 3-tier subscription plans (Base, Pro, Max) with feature flags.
- `ProvidersModule`: DI-swappable providers for PaymentProvider, GeoProvider, and OtpSender with startup logging and mock fallback.

### Stub Modules
- `GET /api/analytics`: Returns stub message ("Analytics coming soon.").
- `GET /api/payments/status`: Returns stub message ("Payments stub. Pay at shop only for the demo.").

## 3. packages/shared
- **Data Types**: `Shop`, `WeeklyHours`, `DayHours`, `Break`, `Barber`, `Service`, `Booking`, `BookingStatus`, `PaymentMethod` (fpx, card, duitnow, ewallet), `PaymentStatus`, `Customer`, `CustomerPreferences`, `Review`, `AvailabilitySlot`, and design tokens.
- **Money System**: All money stored as integer sen (RM 1 = 100 sen). Helper functions: `formatSen`, `senToRm`, `rmToSen`.
- **Financial Settings**: `SERVICE_MARKUP_SEN` (500), `PLATFORM_FEE_PERCENT` (3%), `NOSHOW_DEPOSIT_SPLIT` (70/30).
- **Pricing Function**: `calculateBookingAmounts(servicePriceSen)` returns `servicePriceSen`, `markupSen`, `customerTotalSen`, `platformFeeSen`, and `shopPayoutSen`.
- **Subscription Plans**: Base (RM39/mo, 2 barbers), Pro (RM79/mo, 4 barbers), Max (RM119/mo, 6 barbers) with comprehensive feature flags.
- **Seed Data**: 10 Cheras barbershops (all marked `isDemo: true`, `verificationStatus: 'verified'`), 20 barbers, 29 services (prices in sen), 5 customers (emailVerified: true), 6 historical and upcoming bookings with dynamic relative dates, and 2 reviews.
- **Slot Logic (`buildSlots`)**: Evaluates fixed 30-minute increments between shop opening and closing times.

## 4. apps/mobile Screens and Routes
- `app/_layout.tsx`: Root Stack provider, font loading, NotificationProvider. (Done)
- `app/(tabs)/_layout.tsx`: Tab navigation with unread notification badge on Inbox icon. (Done)
- `app/(tabs)/index.tsx` (`/`): Home tab with dynamic greeting, featured shops row, nearby shops grid. (Done)
- `app/(tabs)/map.tsx` (`/map`): Map tab showing placeholder view. (Placeholder)
- `app/(tabs)/cutmyhair.tsx` (`/cutmyhair`): CutMyHair tab with My QR and Feeling Lucky. Shows relative upcoming seed booking on fresh start. (Done)
- `app/(tabs)/inbox.tsx` (`/inbox`): Inbox tab with Upcoming bookings, Completed bookings with review sheet, and Notifications with unread indicators. (Done)
- `app/(tabs)/profile.tsx` (`/profile`): Language toggle (English / Bahasa Malaysia) with persistent state. (Partial)
- `app/shop/[id].tsx` (`/shop/:id`): Shop detail screen with photo gallery, operating hours with break validation, tabs for services, barbers, reviews, and Book button. (Done)
- `app/booking/new/[shopId].tsx` (`/booking/new/:shopId`): 4-step booking wizard (Service, Barber / Any Barber, 14-day date strip with slot availability, Summary with Pay at shop confirmation). (Done)
- `app/booking/detail/[id].tsx` (`/booking/detail/:id`): Booking detail screen with check-in QR modal, reschedule modal with slot picker, and cancel flow. (Done)
- `app/booking/success.tsx` (`/booking/success`): Booking confirmation screen showing appointment summary. (Done)

## 5. apps/web Pages and Routes
- `app/page.tsx` (`/`): Dashboard landing screen with project branding and skeleton badge. (Placeholder)
- `/bookings`: Not implemented. (Not started)
- `/analytics`: Not implemented. (Not started)
- `/staff`: Not implemented. (Not started)
- `/store`: Not implemented. (Not started)

## 6. PRODUCT.md vs Code Implementation

| Feature | Status | Notes |
|---|---|---|
| Customer: Home Tab | Done | Time greeting, featured shops, nearby shops with distance and price range. |
| Customer: Map Tab | Placeholder | Static placeholder screen, no map library or pin markers rendered. |
| Customer: CutMyHair (My QR) | Done | Retrieves active booking, renders check-in QR modal and 6-char HMAC code. |
| Customer: CutMyHair (Feeling Lucky) | Done | Random shop picker from nearby shops list. |
| Customer: Inbox (Upcoming) | Done | Lists active bookings, navigates to booking details. |
| Customer: Inbox (Completed & Reviews) | Done | Completed bookings list, 1-5 star review modal with comment submission. |
| Customer: Inbox (Notifications) | Done | In-app notifications for booking creation, rescheduling, and cancellation. |
| Customer: Profile Tab | Partial | Language switcher works; customer auth and profile editing not started in mobile UI. |
| Customer: Shop Details | Done | Photos, operating hours with break validation, services, barbers, reviews. |
| Customer: Booking Flow | Done | 4-step wizard, 30m slot calculation, any-barber assignment. |
| Customer: Booking Management | Done | Reschedule with slot picker, cancel, and QR check-in modal. |
| Customer: QR Check-in Validation | Done | API validates 6-char HMAC code within -60m to end time window. |
| Barber: Home Dashboard | Placeholder | Landing skeleton only. |
| Barber: Bookings Management | Not started | View, update, cancel, reschedule, and QR check-in scanner not started. |
| Barber: Analytics | Stub | API returns static stub message; web UI not started. |
| Barber: Staff Management | Not started | Web UI not started. |
| Barber: Store Profile Management | Not started | Web UI not started. |
| Auth: Email OTP & Session Token | Done | API endpoints for request-otp and verify-otp, session token, CustomerAuthGuard. |
| Payments: Provider Abstraction | Done | PaymentProvider interface with MockPaymentProvider, fail-safe fallback logging. |
| Subscriptions & Plans (Base/Pro/Max) | Done | Shared plan definitions with feature flags, GET /api/plans returns real plans. |
| Commission Tracking | Stub | `signedUpViaShopId` in customer model; financial calculations implemented. |
| Email / Calendar Stubs | Stub | OtpSender mock logs to server console. |

## 7. Known Bugs and Loose Ends
- **Hardcoded Demo Customer in Mobile**: Mobile UI uses `cust-001` (Ahmad Faris) in `apps/mobile/src/config/demoCustomer.ts` until auth UI is connected.
- **Hardcoded Location**: Defaults to Cheras coordinates (`3.139, 101.6869`) in both mobile client and API.
- **Automated Reminders Missing**: No background cron or worker triggers reminder notifications before booking start times.
- **Turbopack Build Conflict**: Next.js 16 Turbopack fails to resolve CJS barrel re-exports from `@cutmyhair/shared`. Web scripts use `--webpack` and `transpilePackages: ['@cutmyhair/shared']` as the workaround.

## 8. Versions
- **Expo SDK**: 58 (`expo@~58.0.17`)
- **React Native**: `0.88.1`
- **React**: `19.3.0`
- **Next.js**: `16.4.3`
- **NestJS**: `10.4.22` (core peer `^10.3.0`)
- **React Version Parity**: Yes, both `apps/web` and `apps/mobile` use the exact same React version (`19.3.0`) and `@types/react` (`~19.3.0`), locked via root package overrides.

## 9. How to Run Everything Locally
```bash
npm install
npm --workspace=@cutmyhair/shared run build
npm run dev:api    # NestJS API at http://localhost:3000/api
npm run dev:web    # Next.js barber dashboard at http://localhost:3001
npm run dev:mobile # Expo customer app (press a for Android, w for web)
```

## Summary
- Financial model updated to integer sen with calculateBookingAmounts pure function and unit tests.
- 3 subscription plans (Base, Pro, Max) with feature flags added to shared and returned by GET /api/plans.
- DI-swappable providers for Payments, Geolocation, and OTP created with fail-safe mock fallback.
- Email OTP authentication flow with HMAC session tokens and CustomerAuthGuard added to API.
- Booking routes in mobile separated into /booking/new/[shopId] and /booking/detail/[id] to resolve route collisions.
