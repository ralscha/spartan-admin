package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestSPAHandler(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "index.html"), []byte("<app-root></app-root>"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "main.js"), []byte("console.log('ok')"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(root, "components"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "components", "index.html"), []byte("<h1>Prerendered gallery</h1>"), 0o600); err != nil {
		t.Fatal(err)
	}
	apiHandler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { _, _ = io.WriteString(w, "api") })
	handler, err := withSPA(apiHandler, root)
	if err != nil {
		t.Fatal(err)
	}

	for _, test := range []struct{ path, want string }{{"/dashboard", "<app-root></app-root>"}, {"/components", "<h1>Prerendered gallery</h1>"}, {"/main.js", "console.log('ok')"}, {"/api/health", "api"}} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, test.path, nil))
		if recorder.Code != http.StatusOK || recorder.Body.String() != test.want {
			t.Errorf("%s: got %d %q, want 200 %q", test.path, recorder.Code, recorder.Body.String(), test.want)
		}
	}
}
