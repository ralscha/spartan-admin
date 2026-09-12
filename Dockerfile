FROM node:24-alpine AS frontend
WORKDIR /build/frontend
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

FROM golang:1.27-alpine AS backend
WORKDIR /build/backend
COPY backend/go.mod backend/go.sum ./
COPY backend/ ./
RUN CGO_ENABLED=0 go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /spartan-admin ./cmd/server

FROM scratch
WORKDIR /app
COPY --from=backend /spartan-admin /app/spartan-admin
COPY --from=frontend /build/frontend/dist/spartan-admin/browser /app/public
ENV SPARTAN_ADMIN_ADDRESS=:8080
ENV SPARTAN_ADMIN_WEB_ROOT=/app/public
EXPOSE 8080
USER 65532:65532
ENTRYPOINT ["/app/spartan-admin"]
