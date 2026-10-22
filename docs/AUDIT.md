# Legacy Codebase Audit (CutMyHair Flutter & Firebase)

## 1. Screens

### Customer Mobile App (`CutMyHair_App`)
- **Splash (`splash_page.dart`)**: App logo, loading spinner, auth state redirect.
- **Auth (`login_page.dart`, `register_page.dart`)**: Email and password login/signup with basic validation.
- **Main Shell (`main_layout.dart`)**: Bottom navigation bar with 4 tabs: Map, Home, History, Profile.
- **Home (`home_page.dart`)**: Dynamic greeting header, "Top Rated Barbers" horizontal list, "All Nearby Barbers" list, distance calculation.
- **Map (`map_page.dart`)**: Google Map view with custom canvas markers, light/dark map styling, barber bottom sheet card.
- **Barber Detail (`barber_detail_page.dart`)**: Cover image, bio, stats, 3 tabs (Services, Reviews, Photos), and "Add Review" modal.
- **Booking Flow (`booking_page.dart`, `booking_detail_page.dart`)**: Service selection, native date/time pickers, booking summary, status badge, directions launcher, and cancellation.
- **History (`history_page.dart`)**: List of customer bookings with status filter tabs (All, Pending, Confirmed, Completed, Cancelled).
- **Profile (`profile_page.dart`)**: User avatar upload, name/phone editing, sign out.

### Barber Web Dashboard (`CutMyHair_Web`)
- **Auth (`login_page.dart`, `signup_page.dart`)**: Barber email/password onboarding.
- **Dashboard Shell (`dashboard_page.dart`)**: Collapsible sidebar navigation, active/inactive availability toggle, summary metrics.
- **Appointments (`appointments_page.dart`)**: Tabbed bookings list by status with customer name lookup and status update actions.
- **Services (`services_page.dart`, `add_services_page.dart`, `edit_services_page.dart`)**: Service catalog CRUD (name, price, duration).
- **Reviews (`reviews_page.dart`)**: Customer feedback stream and rating breakdown.
- **Profile (`profile_page.dart`, `edit_profile_page.dart`)**: Shop details editor, pin placement on map, image and 5-photo gallery upload.

---

## 2. Data Models
- **`Barber`**: Conflates individual barbers and shops into one entity (`name`, `barberType`, `experience`, `priceRange`, `latitude`, `longitude`, `imageUrl`, `gallery`, `rating`, `totalReviews`, `isActive`, `isVerified`). Lacks shop entity, staff lists, and operating schedules.
- **`BookingModel`**: Stores `userId`, `barberId`, `serviceId`, `dateTime`, and `status`. Only supports a single service, lacks price snapshots, payment statuses, and shop associations.
- **`ServiceModel`**: Basic item with `barberId`, `name`, `price`, and `durationMinutes`.
- **`ReviewModel`**: Simple rating and comment tied to `barberId` and `userId` (with optional `bookingId`).
- **`AppUser`**: Stores `id`, `name`, `email`, `photo`, and `phone`. No customer/barber role separation.

---

## 3. What Looks Broken or Incompatible
- **Barber vs Shop Entity Structure**: The model assumes 1 barber = 1 shop. It cannot support multiple barbers per shop as required by the new product specification.
- **Primitive Slot Booking Logic**: Users pick arbitrary times via standard OS time pickers (e.g. 3:17 AM). Availability only checks exact timestamp equality, ignoring service duration overlap, business hours, and breaks.
- **Auth Method Mismatch**: Uses email/password authentication instead of Malaysian phone OTP and Google sign-in.
- **Inconsistent Database Schema**: Services are stored under subcollections (`/barbers/{id}/services`) in some places but queried from root (`/services`) in others.
- **No i18n or Localization**: All text is hardcoded in English (with occasional Malay code comments). No Bahasa Malaysia support.
- **Missing Core Flows**: No QR code check-in, "Feeling Lucky" feature, in-app notifications/Inbox, or reschedule mechanism.
- **Fragile Web Patterns**: Barber web dashboard relies on delay loops for Firebase auth readiness and direct storage uploads prone to CORS failures.

---

## 4. Reusable Items
- **Assets**:
  - `CutMyHair_App/cutmyhair_mobileapp/assets/icon/app_icon.png` (app brand icon).
  - `CutMyHair_Web/cutmyhair_dashboard/assets/images/batik1.jpg` (Malaysian batik pattern for subtle background branding).
  - Lato font files (`Lato-Regular.ttf`, `Lato-Bold.ttf`).
- **Copy & Domain Defaults**:
  - Barber category classifications and price range tiers.
  - Kuala Lumpur / Cheras default map coordinates (`3.139, 101.6869`).
- **Flows & UX Logic**:
  - Canvas-drawn pin styles and glowing user location dot in `map_page.dart`.
  - Haversine distance filtering (10km default radius) on home and map screens.
  - Review gating rule requiring a completed booking before submission (`_checkIfReviewed`).
