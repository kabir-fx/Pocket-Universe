## Pocket Universe (pck-unv)

Monorepo for a Next.js app with authentication and a Prisma-backed database. Built with Turborepo and pnpm.

### Structure
- `apps/web`: Next.js app (primary app)
- `apps/docs`: Next.js docs app (optional)
- `packages/ui`: shared UI components
- `packages/db`: Prisma schema and client
- `packages/eslint-config`, `packages/typescript-config`: shared config

### Prerequisites
- Node.js >= 18
- pnpm 9
- A PostgreSQL database URL for local and/or production

### Setup
```bash
pnpm install
```

Create environment files:
- `apps/web/.env.local` (development)
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
NEXTAUTH_SECRET=your_dev_secret
NEXTAUTH_URL=http://localhost:3000
```

### Development
```bash
pnpm dev
```
Open http://localhost:3000.

### Formatting and Linting
- Format all files:
```bash
pnpm run format
```
- Check formatting:
```bash
pnpm run prettier-check
```
- Lint:
```bash
pnpm run lint
```

### Database (Prisma)
The Prisma schema lives in `packages/db/prisma/schema.prisma`.

- Create/migrate (development):
```bash
cd packages/db
export DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"
pnpm dlx prisma migrate dev
```

- Apply migrations (production):
```bash
cd packages/db
export DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"
pnpm dlx prisma migrate deploy
```

### Authentication
The app uses `next-auth` with a Credentials provider. Required envs:
- `NEXTAUTH_SECRET`: random secret string
- `NEXTAUTH_URL`: base URL of the deployment (e.g., Cloud Run URL)
- `DATABASE_URL`: backing Postgres for user storage

### Scripts
Root (repo):
- `dev`: run all apps in dev via Turbo
- `build`: build all packages/apps
- `lint`: run ESLint across the monorepo
- `format` / `prettier-check`: Prettier write/check
- `check-types`: TypeScript type checks

Web app (`apps/web`):
- `dev`, `build`, `start`, `lint`, `check-types`

### Notes
- `Procfile` is for Heroku-style platforms and not used by GCP.
- CI: `.github/workflows/prettier.yaml` runs Prettier checks on PRs.
