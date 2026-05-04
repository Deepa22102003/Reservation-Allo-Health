# ReserveX

Multi-warehouse inventory reservation system built with Next.js 15, Prisma, and Tailwind CSS.

## Features

- Browse products with per-warehouse stock levels
- Atomic checkout holds with configurable TTL (default 10 min)
- Idempotent reservation creation via `Idempotency-Key` header
- Expired hold cleanup on every reservation attempt
- Works in demo mode without a database (sample data)

## Tech stack

- **Next.js 15** (App Router, server components)
- **Prisma** ORM with PostgreSQL
- **Tailwind CSS v4**
- **Zod** for request validation
- **TypeScript** strict mode

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` and `DIRECT_URL` with your Postgres connection strings (Supabase, Neon, Railway, etc.).

### 3. Run migrations

```bash
npm run db:migrate
# or for development:
npm run db:push
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Start development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `RESERVATION_TTL_MINUTES` (optional)
4. Deploy

Vercel runs `prisma generate` automatically if you add it to your build command:
```
prisma generate && next build
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List all products with warehouse stock |
| `POST` | `/api/reservations` | Create a reservation (idempotent) |
| `GET` | `/api/reservations/:id` | Get reservation details |
| `POST` | `/api/reservations/:id/confirm` | Confirm purchase |
| `POST` | `/api/reservations/:id/release` | Cancel reservation |

### Creating a reservation

```http
POST /api/reservations
Content-Type: application/json
Idempotency-Key: <uuid>

{
  "productId": "...",
  "warehouseId": "...",
  "quantity": 1
}
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes* | — | Postgres connection string (pooled) |
| `DIRECT_URL` | Yes* | — | Postgres direct connection (for migrations) |
| `RESERVATION_TTL_MINUTES` | No | `10` | How long holds last |

*App runs in demo mode with sample data if `DATABASE_URL` is not set.
