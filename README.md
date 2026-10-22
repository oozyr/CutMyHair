# CutMyHair

Barber discovery, booking, and management app for Cheras, Kuala Lumpur.

## Prerequisites

- Node.js 20+
- Yarn 1.22+
- Expo Go app on phone (for mobile dev)

## Install

```bash
yarn install
```

## Run

```bash
# API (NestJS) -- http://localhost:3000
yarn dev:api

# Web dashboard (Next.js) -- http://localhost:3001
yarn dev:web

# Mobile app (Expo)
yarn dev:mobile
```

## Project structure

```
apps/
  api/      NestJS in-memory API (demo, no database yet)
  web/      Next.js barber dashboard PWA
  mobile/   Expo React Native customer app
packages/
  shared/   TypeScript types, seed data, design tokens, helpers
legacy/     Old Flutter + Firebase project. Reference only, do not modify.
```

## Environment variables

Copy `.env.example` to `.env` in each app directory and fill in values.
