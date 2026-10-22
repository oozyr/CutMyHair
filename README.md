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

## Testing on phone via Expo Go

1. Find PC Wi-Fi IP on Windows: Open PowerShell and run `ipconfig`. Find your IPv4 Address under your Wi-Fi adapter (for example, `192.168.1.50`).
2. Set it in `apps/mobile/.env`: Change `EXPO_PUBLIC_API_URL` to `http://<YOUR_PC_IP>:3000/api` (for example, `http://192.168.1.50:3000/api`).
3. Start the API: Run `npm run dev:api` (or `yarn dev:api`) in a terminal.
4. Allow through Windows Firewall: Run PowerShell as Administrator and run `New-NetFirewallRule -DisplayName "CutMyHair API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow` (or accept the Windows Security Prompt when Node starts).
