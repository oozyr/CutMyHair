# CutMyHair product details

## Customer app (bottom navbar: Home, Map, CutMyHair, Inbox, Profile)
Core flow: open app, find barber, choose service and barber, pick time, book, get confirmation, QR check-in at the shop.

- Home: greeting at top. Below it, one horizontally scrollable row of featured barbers (paid ads or top performing). Then a 2 column list of nearby barbershops.
- Map: pins of barbershops within a set radius (default 10km). User can change location to view other areas.
- CutMyHair: two sections, default QR.
  - QR: scan at the shop to check in a booking.
  - Feeling Lucky: randomly opens a nearby barbershop.
- Inbox: three sections. Upcoming bookings, Completed bookings, Notifications (booking made, reminder, cancelled, rescheduled).
- Profile.
- Reviews: shop page shows rating and reviews. Only customers with a completed booking at that shop can post one.
- Booking slots: fixed 30 minute steps built from the shop's hours and breaks, per barber. A slot is only offered if the service duration fits. No free time picker.

## Barber web app (left sidebar: Home, Bookings, Analytics, Staff Manage, Store Profile)
- Home: placeholder for now.
- Bookings: see and manage bookings (new, upcoming, completed, update, cancel, reschedule).
- Analytics: placeholder ("coming soon"). Later: barber stats, average spend, customer list, products sold, reviews.
- Staff Manage: placeholder ("coming soon"). Later: staff stats, estimated payroll from commission, permissions, add or remove staff.
- Store Profile: shop name, photos, services and prices, barbers, opening hours and breaks.

## Demo MVP scope (pay at shop only)
Fully working with seeded data (8 to 10 fake Cheras shops, several barbers and services each, sample bookings):
1. Customer: browse, map, shop page, pick service and barber, pick time slot, book, Inbox, Feeling Lucky, QR check-in.
2. Barber: login, see and manage bookings, edit store profile, services, prices, barbers and hours.
3. A booking made in the customer app must show up in the barber dashboard (shared API).
4. Confirmation and reminders appear in the in-app Inbox. Email confirmation and calendar add are stubs behind interfaces.

## The frame (structure only, not features)
- Online payments (Billplz, QR and e-wallets), commission and weekly payouts: stub module and interface. Payment screen shows "Pay at shop".
- Shop plans, modelled in data with feature flags:
  - Base RM29/month: shop discoverable, bookings, reviews, 1 barber, pay at shop only. +RM5 per extra barber.
  - Pro RM49/month: 3 barbers, online payments, analytics, staff and commission tracking. +RM7 per extra barber.
- Commission model (data design only, no logic): 3% when a customer signed up through shop A's link and pays online at shop A, 5% otherwise, 0% on pay at shop. Store which shop a customer signed up through.
- Module folders in apps/api for: auth, shops, barbers, services, bookings, notifications, payments (stub), plans (stub), analytics (stub).