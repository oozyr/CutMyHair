# CutMyHair product details

## Customer app (bottom navbar: Home, Map, CutMyHair, Inbox, Profile)
Core flow: open app, find barber, choose service and barber, pick time, book, get confirmation, QR check-in at the shop.

- Home: greeting at top. Below it, one horizontally scrollable row of featured barbers (paid ads or top performing). Then a 2 column list of nearby barbershops.
- Map: pins of barbershops within a set radius (default 10km). User can change location to view other areas.
- CutMyHair: two sections, default My QR.
  - My QR: shortcut to the check-in QR of the customer's nearest upcoming booking. The customer shows it at the shop and the shop scans it (barber dashboard, on phone or laptop). Empty state with a "find a barber" button if there is no upcoming booking. No in-app camera for customers.
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
- Check-in: each booking has a 6 character code and a QR payload ("cmh:checkin:<bookingId>:<code>") from the API. The shop scans the QR or types the code in the barber dashboard, and the booking becomes checked_in (allowed from 60 minutes before start until the end time).
- Shop link and poster QR (later): each shop gets a link that customers scan with their normal phone camera, opening the shop page ready to book. It also records which shop a customer signed up through (signedUpViaShopId) for the 3% commission rule. Deep linking is for later, not the demo.
- Module folders in apps/api for: auth, shops, barbers, services, bookings, notifications, payments (stub), plans (stub), analytics (stub).