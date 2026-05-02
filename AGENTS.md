# AGENTS.md — CanchaYa Backend

## Project Overview

NestJS v11 + Prisma v7 backend for a sports court booking platform. Single app (no monorepo). PostgreSQL via Docker.

## Directory Structure

```
Backend/
├── docker-compose.yaml   ← run from here
└── app/                  ← all code and npm commands run here
    ├── src/
    │   ├── main.ts             entrypoint; global prefix `v1/api`
    │   ├── app.module.ts       imports: PrismaModule, UsersModule
    │   ├── config/prisma/      PrismaService (uses @prisma/adapter-pg)
    │   ├── common/             interceptors, filters, decorators, enums
    │   ├── modules/            feature modules (only `users/` implemented)
    │   └── generated/prisma/   Prisma client output (not node_modules/.prisma)
    └── prisma/
        ├── schema.prisma       models: User, Court, TimeSlot, Booking, Payment, Review, Subscription, Notification
        └── seed.ts             run via `npm run seed`
```

## Developer Commands

All commands run from `app/`:

| Task | Command |
|---|---|
| Start dev server | `npm run start:dev` |
| Build | `npm run build` |
| Run prod | `npm run start:prod` |
| Lint | `npm run lint --fix` |
| Format | `npm run format` |
| Unit tests | `npm run test` |
| Single test | `npm run test -- -t "pattern"` |
| E2E tests | `npm run test:e2e` |
| Prisma generate | `npx prisma generate` |
| Prisma migrate | `npx prisma migrate dev` |
| Seed DB | `npm run seed` |
| Docker (from root) | `docker compose up` |

**Typical workflow after schema change:** `npx prisma generate && npx prisma migrate dev`

## Key Gotchas

- **Prisma client output** is `src/generated/prisma/` (custom path in schema). The `.gitignore` excludes `**/generated/prisma`. Always run `npx prisma generate` after cloning or schema changes.
- **Prisma uses `@prisma/adapter-pg`** (not the native Prisma driver). The PrismaService wraps `PrismaClient` with a `PrismaPg` adapter using `DATABASE_URL`.
- **`app/.env` is empty** — real env vars come from root `.env`, mounted into the container via docker-compose.
- **API base path** is `v1/api` (set in `main.ts` via `setGlobalPrefix`).
- **Port** is `3007` (configured in root `.env` as `APP_PORT`).
- **Only `users` module exists** — the schema defines Court, Booking, Payment, Review, Subscription, Notification models but no corresponding modules yet.
- **Node 24 Alpine** base image in Dockerfile.

## Prisma Schema Models

| Model | Key Fields | Relations |
|---|---|---|
| User | id (uuid), email (unique), phone (unique), role (ADMIN/OWNER/PLAYER) | courts[], bookings[], reviews[], subscription?, notifications[] |
| Court | id, price, surface (SYNTHETIC/NATURAL/FUTSAL), ownerId | owner→User, timeSlots[], bookings[], reviews[] |
| TimeSlot | id, startTime, endTime, isBooked | court→Court, booking? |
| Booking | id, date, status (PENDING/CONFIRMED/CANCELLED), total | user→User, court→Court, timeSlot→TimeSlot (unique), payment? |
| Payment | id, amount, status (PENDING/PAID/REFUNDED), stripeId | booking→Booking (unique) |
| Review | id, rating, comment | user→User, court→Court |
| Subscription | id, plan (BASIC/PRO/PREMIUM), status (ACTIVE/INACTIVE/CANCELLED) | user→User (unique) |
| Notification | id, title, message, read | user→User |

## Testing

- **Unit tests**: Jest, `rootDir: src`, pattern `*.spec.ts`
- **E2E tests**: separate config in `test/jest-e2e.json`, run via `npm run test:e2e`
