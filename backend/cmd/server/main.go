package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"spartan-admin/internal/api"
	"spartan-admin/internal/store"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	address := os.Getenv("SPARTAN_ADMIN_ADDRESS")
	if address == "" {
		address = ":8080"
	}
	handler := api.New(store.New(), logger)
	if webRoot := os.Getenv("SPARTAN_ADMIN_WEB_ROOT"); webRoot != "" {
		var err error
		handler, err = withSPA(handler, webRoot)
		if err != nil {
			logger.Error("invalid web root", "error", err)
			os.Exit(1)
		}
	}
	server := &http.Server{Addr: address, Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			logger.Error("shutdown", "error", err)
		}
	}()
	logger.Info("server started", "address", address)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func withSPA(apiHandler http.Handler, webRoot string) (http.Handler, error) {
	root, err := filepath.Abs(webRoot)
	if err != nil {
		return nil, err
	}
	index := filepath.Join(root, "index.html")
	if _, err := os.Stat(index); err != nil {
		return nil, err
	}
	files := http.FileServer(http.Dir(root))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			apiHandler.ServeHTTP(w, r)
			return
		}
		requested := filepath.Join(root, filepath.FromSlash(strings.TrimPrefix(filepath.Clean(r.URL.Path), string(filepath.Separator))))
		if relative, relativeErr := filepath.Rel(root, requested); relativeErr == nil && relative != ".." && !strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
			if info, statErr := os.Stat(requested); statErr == nil {
				if !info.IsDir() {
					files.ServeHTTP(w, r)
					return
				}
				prerenderedIndex := filepath.Join(requested, "index.html")
				if indexInfo, indexErr := os.Stat(prerenderedIndex); indexErr == nil && !indexInfo.IsDir() {
					http.ServeFile(w, r, prerenderedIndex)
					return
				}
			}
		}
		http.ServeFile(w, r, index)
	}), nil
}
