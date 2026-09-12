# Spartan Admin frontend

The frontend is an Angular 22, zoneless, signal-driven admin dashboard. It uses Spartan primitives, Tailwind CSS v4, self-hosted Inter Variable typography, reactive `httpResource` reads, and route-level prerendering.

## Development

Start the Go API on port `8080`, then run:

```powershell
pnpm install
pnpm start
```

Open `http://localhost:4200`. Requests under `/api` are proxied to the backend.

## Quality gates

```powershell
pnpm run lint
pnpm test
pnpm run build
```

Vitest runs through Angular's native unit-test builder. The production build prerenders public, authentication, component-gallery, and error routes while keeping authenticated application routes client-rendered.

Visit `/components` for the interactive Spartan gallery. It demonstrates the 12 locally owned Helm groups, their Brain-backed accessibility behavior, theme tokens, and Angular signal interactions.

API behavior and authorization are covered by the Go test suite.
