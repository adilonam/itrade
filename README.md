# Trade Nova

A multi-tenant trading platform with **Room Trading**, **Room Stock**, and **Invest** — one app, role-based navigation, and shared auth.

## What it does

- **Dashboard** — Overview, transactions, messages, deposit/withdraw, news, useful links, account.
- **Room Trading** — Markets, positions, trade transactions; leverage and margin (configurable).
- **Room Stock** — Stock markets, portfolio, stock transactions.
- **Invest** — Investment overview, my investments, invest transactions.
- **Administration** — Sellers and admins manage users, positions, investments, markets, messages, useful links, withdraw requests.
- **Configuration** — Super-admin: app settings, theme settings.

Navigation is **tenant + role** based (see `src/constants/data.ts`). Roles: `USER`, `SELLER`, `ADMIN`, `SUPERADMIN`.

## Tech stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router), [React 19](https://react.dev)
- **Language** — [TypeScript](https://www.typescriptlang.org)
- **Auth** — [NextAuth.js](https://next-auth.js.org) (credentials + Google)
- **Database** — [PostgreSQL](https://www.postgresql.org) with [Prisma 7](https://www.prisma.io) (`src/lib/prisma.ts`)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **UI** — [Radix UI](https://www.radix-ui.com), [tabler-icons-react](https://tabler.io/icons), optional [shadcn/ui](https://ui.shadcn.com)
- **Validation** — [Zod](https://zod.dev)
- **State** — [Zustand](https://zustand-demo.pmnd.rs), [Nuqs](https://nuqs.47ng.com/) (search params)
- **Market data** — Twelve Data API; optional Alpha Vantage for news
- **Storage** — PostgreSQL-backed image bytes for private profile and KYC images
- **Tooling** — ESLint, Prettier, Husky, lint-staged

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (or use Docker)

### Install and run

```bash
git clone https://github.com/adilonam/trade-nova.git
cd trade-nova
pnpm install
cp .env.example .env
# Edit .env with your DB, NextAuth, Twelve Data, SMTP, etc.
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

```bash
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Run migrations (dev)
pnpm db:push       # Push schema (prototype)
pnpm db:studio     # Open Prisma Studio
pnpm db:seed       # Seed database
```

### Docker

```bash
pnpm docker:up     # Start PostgreSQL (see docker-compose.yml)
pnpm docker:down   # Stop
```

Set `DATABASE_URL` in `.env` to match (e.g. `postgresql://trading_user:trading_password@localhost:5432/trading_app_db`).

## Environment

Copy `.env.example` to `.env` and fill in:

| Variable                                                 | Purpose                                |
| -------------------------------------------------------- | -------------------------------------- |
| `DATABASE_URL`                                           | PostgreSQL connection string           |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET`                        | NextAuth base URL and secret           |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`               | Google OAuth (optional)                |
| `NEXT_PUBLIC_TWELVE_DATA_API_KEY`, `TWELVE_DATA_API_KEY` | Market data (use `"demo"` for testing) |
| `SMTP_*`                                                 | Email (MFA / notifications)            |
| `MIN_MARGIN_LEVEL`                                       | Margin call threshold (default 100)    |
| `ALPHAVANTAGE_API_KEY`                                   | News/sentiment (optional)              |

## Scripts

| Command                       | Description                            |
| ----------------------------- | -------------------------------------- |
| `pnpm dev`                    | Next.js dev server (Turbopack)         |
| `pnpm build`                  | Prisma generate + migrate + Next build |
| `pnpm start`                  | Production server                      |
| `pnpm lint` / `pnpm lint:fix` | ESLint                                 |
| `pnpm format`                 | Prettier                               |
| `pnpm setup`                  | Run `./setup.sh`                       |

## Project layout

```text
src/
├── app/              # Next.js App Router (auth, dashboard, API)
├── components/       # Shared UI (layout, etc.)
├── constants/        # Navigation, tenants (data.ts)
├── features/         # Feature modules (components, actions, schemas)
├── lib/              # Prisma, auth, utils
├── hooks/            # Custom hooks
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

Tenant and role-based nav is defined in `src/constants/data.ts` (`tenantNavItems`).

## License

Private. Author: [adilonam](https://github.com/adilonam).
