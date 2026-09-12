# Spartan Admin API

Go 1.27 JSON API for the Angular dashboard. It ships with an in-memory demo data set, Argon2id password hashes, HttpOnly cookie sessions, CORS for the Angular development server, structured logs, and graceful shutdown.

```powershell
go run ./cmd/server
```

The API listens on `http://localhost:8080`. Override it with `SPARTAN_ADMIN_ADDRESS`. The demo account is `admin@example.com` / `Spartan300`.
