# Profitwalla + Copy Trading System

Two fully decoupled systems that communicate through a controlled internal API.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────────┐
│   System 1          │  Signed │    System 2              │
│   Profitwalla.com   │  API    │    Copy Trading          │
│                     │────────►│                         │
│  • Client Onboarding│         │  • Trade Mirroring      │
│  • Admin Panel      │         │  • MetaApi Integration  │
│  • Lead Capture     │         │  • Staff Panel          │
│  • No Trading Logic │         │  • Reconciliation       │
└─────────────────────┘         └─────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- MetaApi.cloud account (for System 2)

### System 1 — Profitwalla

```bash
cd profitwalla
cp .env.example .env  # Fill in secrets
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Runs on: http://localhost:3000

### System 2 — Copy Trading

```bash
cd copytrading
cp .env.example .env  # Fill in secrets (ENCRYPTION_KEY must match System 1)
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Runs on: http://localhost:3001

## Key Features

### System 1 (Profitwalla)
- Stepper onboarding form with live validation
- OTP mobile verification (Twilio integration ready)
- AES-256-GCM encrypted investor passwords
- Admin panel with audit log
- One-click push to copy trading system

### System 2 (Copy Trading)
- MetaApi.cloud integration for trade execution
- Per-client copy mode (fixed ratio, equity proportional, fixed lot)
- Automatic drawdown protection with pause
- Symbol whitelisting
- Live trade feed with execution latency tracking
- Reconciliation jobs for position verification
- Connection health monitoring

## Security

- **Investor passwords** encrypted at rest with AES-256-GCM
- **Never log** credentials in plaintext
- **Admin panel** credential reveal requires re-authentication + audit log
- **Inter-system API** uses shared secret authentication
- **Consent checkbox** with risk disclosure required

## Default Credentials (Development)

### System 1 Admin
- Email: `admin@profitwalla.com`
- Password: `admin123`

### System 2 Staff
- Email: `staff@copytrading.local`
- Password: `staff123`

## Production Checklist

- [ ] Change all default passwords
- [ ] Generate new ENCRYPTION_KEY (64 hex chars)
- [ ] Set strong INTER_SYSTEM_API_SECRET
- [ ] Configure MetaApi credentials
- [ ] Configure Twilio for OTP
- [ ] Set up Resend for emails
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Review and update risk disclosure copy
- [ ] Confirm SEBI/RBI registration requirements
