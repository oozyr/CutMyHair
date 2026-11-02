# CutMyHair agent rules

CutMyHair is one app for Malaysians to find, compare, book and pay a barber. First market: Cheras, Kuala Lumpur.
Two products: a customer mobile app and a barber web dashboard.

## Current goal
Demo-ready MVP to show shop owners with real Billplz online payments (and mock mode when keys are absent). Not production yet.
Full product details are in docs/PRODUCT.md. Read it only when a task needs it.

## Stack
- Customer app: Expo React Native (apps/mobile)
- Barber web app: Next.js PWA (apps/web, not started yet)
- API: NestJS modular monolith (apps/api). For the demo it uses an in-memory store with seeded Cheras data. Postgres with PostGIS comes later.
- Shared types and seed data: packages/shared
- TypeScript everywhere. Google Maps for maps.
- Old Flutter and Firebase project lives in /legacy. Reference only. Never fix or run it.

## Product rules
- Languages: Bahasa Malaysia and English only. All text goes through i18n, no hardcoded strings.
- Login: email OTP with signed 30-day session tokens. In dev, OTP uses DEV_FIXED_OTP or prints to the server console.
- Reminders are in app only (push and Inbox). No WhatsApp or SMS reminders.
- No built-in prayer times or Friday breaks. Each shop sets its own hours.
- Online payments only through Billplz (or local mock checkout when keys are not configured). Payouts, analytics and payroll are stubs only.

## How to work
- Do only the task in the current prompt. Do not touch unrelated files or refactor things nobody asked for.
- Keep steps small and leave the project in a state that runs. Run it before saying it is done.
- Use one consistent design system (tokens in packages/shared or the app theme). Mobile-first, clean, modern.
- Ask before big decisions. If you are guessing, say so. Do not ask about small things, pick a sensible default.
- Secrets (Google Maps key, etc.) go in .env files, never in code. Keep .env.example updated.
- Keep README short: how to install and run everything.
- No em dashes in any text you write.
