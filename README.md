# Pocket Universe (pck-unv)

A Turborepo-powered monorepo for a Next.js 15 app with authentication, Prisma/PostgreSQL, and shared UI. Uses pnpm workspaces and shared configs for consistency.

## Monorepo Structure

- `apps/web`: Primary Next.js app (App Router)
- `apps/docs`: Secondary Next.js app for docs/marketing
- `packages/ui`: Shared React UI components (plain CSS modules)
- `packages/db`: Prisma schema, client, and migrations
- `packages/eslint-config`, `packages/typescript-config`: Shared lint/TS configs

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: next-auth v4 with GitHub, Google, and Credentials providers
- **DB/ORM**: PostgreSQL + Prisma
- **Styling**: CSS modules (shared `@repo/ui` components)
- **Tooling**: Turborepo, pnpm, TypeScript, ESLint, Prettier

## Key Features

- **GitHub & Google OAuth**: One-click sign-in via `next-auth` providers
- **Credentials Auth**: Email + password sign-in with bcrypt hashing
- **Session Management**: JWT strategy with user id exposed on `session.user.id`
- **User Accounts**: Prisma models for `User`, `Account`, `Session`, `VerificationToken`
- **Playground**: Create "planets" and organize them into "galaxies"
- **Dashboard**: Authenticated view of your galaxies/planets with counts
- **Shared UI**: Reusable components from `@repo/ui` (e.g., `SigninCard`, `DashboardLayout`)
- **Monorepo DX**: Shared TS/ESLint configs and single install/build across apps/packages

## Auth Overview

Auth configuration lives in `apps/web/lib/auth.ts` and is wired to NextAuth route at `apps/web/app/api/auth/[...nextauth]/route.ts`.

Enabled providers:

- GitHub (`GITHUB_ID`, `GITHUB_SECRET`)
- Google (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- Credentials (email/password) with bcrypt compare

Session strategy is JWT. The session callback augments `session.user` with `id`. Types extended in `apps/web/types/next-auth.d.ts`.

### Required Environment Variables (apps/web)

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — strong random string
- `NEXTAUTH_URL` — base URL of the deployment
- `GITHUB_ID`, `GITHUB_SECRET` — GitHub OAuth app creds (optional if not used)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth app creds (optional if not used)

## Database Schema

Defined in `packages/db/prisma/schema.prisma`:

- `User` with optional `password` for credentials auth
- `Account`, `Session`, `VerificationToken` for OAuth/NextAuth
- Domain models: `Galaxy` and `Planet` with relations to `User`

## API Routes (apps/web)

- `GET /api/dashboard` — List galaxies with latest planets for current user
- `DELETE /api/dashboard` — Delete planets by content for current user
- `POST /api/auth/signup` — Create user with hashed password
- `POST /api/playground/galaxyCheck` — Ensure a galaxy exists (create if missing)
- `POST /api/playground/planetCreate` — Create a planet and (optionally) connect to a galaxy
- `GET|POST /api/auth/[...nextauth]` — NextAuth handlers

## UI/Pages

- Auth pages: `app/auth/signin`, `app/auth/signup` using `@repo/ui` cards
- `app/playground` for creating content
- `app/dashboard` for viewing user data
- Global `Providers` include `SessionProvider` and top navigation outside auth routes

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9
- PostgreSQL database

### Install

```bash
pnpm install
```

### Configure Environment

Create `apps/web/.env`:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
# Optional OAuth providers
GITHUB_ID=xxxx
GITHUB_SECRET=xxxx
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx
```

### Database Migrations

```bash
cd packages/db
export DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"
pnpm dlx prisma migrate dev
```

### Run Dev

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

Root scripts:

- `dev` — run all apps in dev via Turbo
- `build` — build all apps and packages
- `start` — start `apps/web`
- `lint` — run ESLint across the monorepo
- `format` / `prettier-check` — Prettier write/check
- `check-types` — TypeScript checks

## Deployment Notes

- Provide `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and any OAuth creds
- Run `prisma migrate deploy` in `packages/db` during deploy
- `apps/web` uses `next start` after `next build`
