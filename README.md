# [Spartan](https://www.spartan.ng/) Admin — [Angular](https://angular.dev/) + Go

A full-stack admin dashboard demonstrating Angular and Spartan, backed by a Go 1.27 JSON API.

## Stack

- Angular 22 standalone components with zoneless change detection and hydration
- Signals and `httpResource` for domain state, reactive reads, preferences, loading, selection, filtering, and derived state
- Spartan Brain primitives, locally owned Helm components, and Tailwind CSS v4
- Vitest coverage through Angular's native unit-test builder
- Self-hosted Inter Variable typography with a 16 px body size
- Go 1.27 standard-library HTTP server with typed routes, structured logs, graceful shutdown, and SPA hosting
- Argon2id password hashing through `github.com/alexedwards/argon2id`
- HttpOnly session cookies and role-based authorization

## Run locally

Use two terminals:

```powershell
cd backend
go run ./cmd/server
```

```powershell
cd frontend
pnpm install
pnpm start
```

Open `http://localhost:4200`. The Angular development server proxies `/api` to Go on port `8080`.

The root [Taskfile](Taskfile.yml) provides the same workflows from one terminal:

```powershell
task setup
task dev
```

Run `task --list` to see the available frontend, backend, preview, verification, and Docker tasks. Use `task dogfood` to build and serve the complete application on `http://localhost:18080`.

Demo credentials:

- Email: `admin@example.com`
- Password: `Spartan300`

## Production build

```powershell
cd frontend
pnpm run build

cd ..\backend
$env:SPARTAN_ADMIN_WEB_ROOT = '..\frontend\dist\spartan-admin\browser'
go run ./cmd/server
```

Then open `http://localhost:8080`.

Or build and run the combined container:

```powershell
docker compose up --build
```

## Verification

Run every quality gate with:

```powershell
task verify
```

Or run the underlying commands directly:

```powershell
cd backend
go test ./...
go vet ./...

cd ..\frontend
pnpm run lint
pnpm test
pnpm run build
```

The static production build prerenders 14 public, authentication, gallery, and error routes. Authenticated dashboard routes remain client-rendered.

## Demo persistence

The Go store intentionally keeps demo data in memory. CRUD operations and settings persist for the lifetime of the server process and reset when it restarts. Replace `internal/store` with a durable adapter before using the application for production data.
