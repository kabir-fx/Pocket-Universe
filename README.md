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

> Note: Avoid `prisma migrate reset` in production; it drops data.

### Authentication
The app uses `next-auth` with a Credentials provider. Required envs:
- `NEXTAUTH_SECRET`: random secret string
- `NEXTAUTH_URL`: base URL of the deployment (e.g., Cloud Run URL)
- `DATABASE_URL`: backing Postgres for user storage

### Deploying to Google Cloud Run

You can deploy via source builds (Buildpacks) or with a container image.

#### Option A: Source deploy (recommended for this monorepo)
Deploy only the web app directory so the correct `start` script is used.
```bash
export PROJECT_ID="your-gcp-project"
export REGION="asia-south1"
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

gcloud run deploy pocket-universe \
  --source apps/web \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,NEXTAUTH_URL=https://YOUR_SERVICE_URL \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest
```

#### Option B: Container image deploy
Build an image and deploy it. This avoids monorepo detection issues.
```bash
export PROJECT_ID="your-gcp-project"
export REGION="asia-south1"
export REPO="web" # Artifact Registry repo
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker images for pck-unv" || true

export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/pck-unv-web:$(git rev-parse --short HEAD)"
gcloud builds submit --tag "$IMAGE" .

gcloud run deploy pocket-universe \
  --image "$IMAGE" \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,NEXTAUTH_URL=https://YOUR_SERVICE_URL \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest
```

#### Cloud Run troubleshooting
- Error: container did not listen on `$PORT` (e.g., 8080)
  - Fix 1: Use `--source apps/web` so Cloud Run uses the app’s `start` script
  - Fix 2: Add a root script that forwards to the web app (if you deploy from repo root):
    - In root `package.json` add: `"start": "pnpm -C apps/web start -p $PORT"`
  - Ensure the app uses `next start -p $PORT` (Next.js default honors `PORT`)

#### Verify
```bash
gcloud run services describe pocket-universe --format='value(status.url)'
gcloud logs tail --region $REGION --service pocket-universe
```

#### Apply database migrations (production)
Run once per deploy if you have new migrations:
```bash
cd packages/db
export DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"
pnpm dlx prisma migrate deploy
```

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
