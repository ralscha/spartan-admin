package api_test

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"spartan-admin/internal/api"
	"spartan-admin/internal/store"
)

func TestAuthenticationAndProtectedResources(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	unauthenticated := httptest.NewRecorder()
	handler.ServeHTTP(unauthenticated, httptest.NewRequest(http.MethodGet, "/api/users", nil))
	if unauthenticated.Code != http.StatusUnauthorized {
		t.Fatalf("want 401, got %d", unauthenticated.Code)
	}

	body, _ := json.Marshal(map[string]string{"email": "admin@example.com", "password": "Spartan300"})
	signIn := httptest.NewRecorder()
	handler.ServeHTTP(signIn, httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", bytes.NewReader(body)))
	if signIn.Code != http.StatusOK {
		t.Fatalf("sign in: want 200, got %d: %s", signIn.Code, signIn.Body.String())
	}
	cookies := signIn.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("sign in did not set a session cookie")
	}

	request := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	request.AddCookie(cookies[0])
	users := httptest.NewRecorder()
	handler.ServeHTTP(users, request)
	if users.Code != http.StatusOK {
		t.Fatalf("users: want 200, got %d", users.Code)
	}
}

func TestTaskLifecycle(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	authBody := bytes.NewBufferString(`{"email":"admin@example.com","password":"Spartan300"}`)
	signIn := httptest.NewRecorder()
	handler.ServeHTTP(signIn, httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", authBody))
	cookie := signIn.Result().Cookies()[0]

	createBody := bytes.NewBufferString(`{"title":"Verify Go API","status":"todo","label":"feature","priority":"high","createdAt":"0001-01-01T00:00:00Z"}`)
	request := httptest.NewRequest(http.MethodPost, "/api/tasks", createBody)
	request.AddCookie(cookie)
	created := httptest.NewRecorder()
	handler.ServeHTTP(created, request)
	if created.Code != http.StatusCreated {
		t.Fatalf("create task: want 201, got %d: %s", created.Code, created.Body.String())
	}
	var task store.Task
	if err := json.NewDecoder(created.Body).Decode(&task); err != nil {
		t.Fatal(err)
	}
	if task.ID == "" {
		t.Fatal("created task has no id")
	}

	deleteRequest := httptest.NewRequest(http.MethodDelete, "/api/tasks/"+task.ID, nil)
	deleteRequest.AddCookie(cookie)
	deleted := httptest.NewRecorder()
	handler.ServeHTTP(deleted, deleteRequest)
	if deleted.Code != http.StatusNoContent {
		t.Fatalf("delete task: want 204, got %d", deleted.Code)
	}
}

func TestViewerCannotAdministerUsers(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	signUpBody := bytes.NewBufferString(`{"name":"Viewer Test","email":"viewer-test@example.com","password":"CorrectHorseBatteryStaple!27"}`)
	signUp := httptest.NewRecorder()
	handler.ServeHTTP(signUp, httptest.NewRequest(http.MethodPost, "/api/auth/sign-up", signUpBody))
	if signUp.Code != http.StatusCreated {
		t.Fatalf("sign up: want 201, got %d: %s", signUp.Code, signUp.Body.String())
	}
	cookie := signUp.Result().Cookies()[0]

	for _, test := range []struct {
		method string
		path   string
		body   string
	}{
		{method: http.MethodGet, path: "/api/users"},
		{method: http.MethodPost, path: "/api/users", body: `{"name":"Escalation","email":"escalation@example.com","role":"Owner","status":"active"}`},
		{method: http.MethodPut, path: "/api/users/usr_admin", body: `{"name":"Changed","email":"changed@example.com","role":"Owner","status":"active"}`},
		{method: http.MethodDelete, path: "/api/users/usr_admin"},
	} {
		request := httptest.NewRequest(test.method, test.path, bytes.NewBufferString(test.body))
		request.AddCookie(cookie)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Errorf("%s %s: want 403, got %d: %s", test.method, test.path, response.Code, response.Body.String())
		}
	}
}

func TestAdminCannotAssignOrModifyOwner(t *testing.T) {
	data := store.New()
	handler := api.New(data, slog.New(slog.NewTextHandler(io.Discard, nil)))
	cookie := &http.Cookie{Name: "spartan_session", Value: data.NewSession("usr_aiko")}

	for _, test := range []struct {
		method string
		path   string
		body   string
	}{
		{method: http.MethodPost, path: "/api/users", body: `{"name":"Escalation","email":"escalation@example.com","role":"Owner","status":"active"}`},
		{method: http.MethodPut, path: "/api/users/usr_admin", body: `{"name":"Changed","email":"changed@example.com","role":"Owner","status":"active"}`},
		{method: http.MethodDelete, path: "/api/users/usr_admin"},
	} {
		request := httptest.NewRequest(test.method, test.path, bytes.NewBufferString(test.body))
		request.AddCookie(cookie)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != http.StatusForbidden {
			t.Errorf("%s %s: want 403, got %d: %s", test.method, test.path, response.Code, response.Body.String())
		}
	}
}

func TestMailSendAndCalendarAndSettingsRoundTrips(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	authBody := bytes.NewBufferString(`{"email":"admin@example.com","password":"Spartan300"}`)
	signIn := httptest.NewRecorder()
	handler.ServeHTTP(signIn, httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", authBody))
	cookie := signIn.Result().Cookies()[0]

	exportRequest := httptest.NewRequest(http.MethodGet, "/api/dashboard/export", nil)
	exportRequest.AddCookie(cookie)
	exportResponse := httptest.NewRecorder()
	handler.ServeHTTP(exportResponse, exportRequest)
	if exportResponse.Code != http.StatusOK || exportResponse.Header().Get("Content-Disposition") != `attachment; filename="dashboard-report.csv"` {
		t.Fatalf("dashboard export failed: status=%d disposition=%q", exportResponse.Code, exportResponse.Header().Get("Content-Disposition"))
	}
	if exportResponse.Body.Len() == 0 {
		t.Fatal("dashboard export was empty")
	}

	invoiceRequest := httptest.NewRequest(http.MethodGet, "/api/billing/invoices/INV-2026-008", nil)
	invoiceRequest.AddCookie(cookie)
	invoiceResponse := httptest.NewRecorder()
	handler.ServeHTTP(invoiceResponse, invoiceRequest)
	if invoiceResponse.Code != http.StatusOK || invoiceResponse.Header().Get("Content-Disposition") != `attachment; filename="INV-2026-008.txt"` {
		t.Fatalf("invoice download failed: status=%d disposition=%q", invoiceResponse.Code, invoiceResponse.Header().Get("Content-Disposition"))
	}
	if !bytes.Contains(invoiceResponse.Body.Bytes(), []byte("Status: Paid")) {
		t.Fatalf("invoice body was incomplete: %s", invoiceResponse.Body.String())
	}

	send := httptest.NewRequest(http.MethodPost, "/api/mail", bytes.NewBufferString(`{"to":"recipient@example.com","subject":"Hello","body":"Sent body"}`))
	send.AddCookie(cookie)
	sent := httptest.NewRecorder()
	handler.ServeHTTP(sent, send)
	if sent.Code != http.StatusCreated {
		t.Fatalf("send mail: want 201, got %d: %s", sent.Code, sent.Body.String())
	}
	var mail store.Mail
	if err := json.NewDecoder(sent.Body).Decode(&mail); err != nil {
		t.Fatal(err)
	}
	if mail.Folder != "Sent" || mail.Subject != "Hello" {
		t.Fatalf("sent mail was not preserved: %+v", mail)
	}

	mailPatch := httptest.NewRequest(http.MethodPatch, "/api/mail/mail_1", bytes.NewBufferString(`{"read":true,"folder":"Archive"}`))
	mailPatch.AddCookie(cookie)
	mailPatched := httptest.NewRecorder()
	handler.ServeHTTP(mailPatched, mailPatch)
	if mailPatched.Code != http.StatusOK {
		t.Fatalf("update mail: want 200, got %d: %s", mailPatched.Code, mailPatched.Body.String())
	}
	if err := json.NewDecoder(mailPatched.Body).Decode(&mail); err != nil {
		t.Fatal(err)
	}
	if mail.Folder != "Archive" || !mail.Read {
		t.Fatalf("mail update was not preserved: %+v", mail)
	}

	transactionPatch := httptest.NewRequest(http.MethodPatch, "/api/transactions/txn_1", bytes.NewBufferString(`{"status":"refunded"}`))
	transactionPatch.AddCookie(cookie)
	transactionPatched := httptest.NewRecorder()
	handler.ServeHTTP(transactionPatched, transactionPatch)
	if transactionPatched.Code != http.StatusOK {
		t.Fatalf("refund transaction: want 200, got %d: %s", transactionPatched.Code, transactionPatched.Body.String())
	}
	var transaction store.Transaction
	if err := json.NewDecoder(transactionPatched.Body).Decode(&transaction); err != nil {
		t.Fatal(err)
	}
	if transaction.Status != "refunded" {
		t.Fatalf("transaction status was not preserved: %+v", transaction)
	}

	eventBody := bytes.NewBufferString(`{"title":"Calendar test","description":"Planning session","startsAt":"2026-08-26T10:00:00Z","type":"meeting","calendar":"Work","duration":"1.5 hours","location":"Room 12","attendees":["NP","AK"],"allDay":false,"reminder":true}`)
	eventRequest := httptest.NewRequest(http.MethodPost, "/api/calendar/events", eventBody)
	eventRequest.AddCookie(cookie)
	eventResponse := httptest.NewRecorder()
	handler.ServeHTTP(eventResponse, eventRequest)
	if eventResponse.Code != http.StatusCreated {
		t.Fatalf("save event: want 201, got %d: %s", eventResponse.Code, eventResponse.Body.String())
	}
	var event store.CalendarEvent
	if err := json.NewDecoder(eventResponse.Body).Decode(&event); err != nil {
		t.Fatal(err)
	}
	if event.Calendar != "Work" || event.Duration != "1.5 hours" || event.Location != "Room 12" || !event.Reminder || len(event.Attendees) != 2 {
		t.Fatalf("calendar event fields were not preserved: %+v", event)
	}

	settingsBody := bytes.NewBufferString(`{"name":"Nyein Phyo","email":"admin@example.com","bio":"","language":"English","theme":"system","compact":true,"marketingEmails":true,"securityEmails":true,"communicationEmails":true,"mobileNotifications":true,"desktopNotifications":true,"defaultDashboard":"business","sidebarBehavior":"collapsed","billingPlan":"Enterprise","cardLastFour":"8675","cardExpiry":"12/30"}`)
	settingsRequest := httptest.NewRequest(http.MethodPut, "/api/settings", settingsBody)
	settingsRequest.AddCookie(cookie)
	settingsResponse := httptest.NewRecorder()
	handler.ServeHTTP(settingsResponse, settingsRequest)
	if settingsResponse.Code != http.StatusOK {
		t.Fatalf("save settings: want 200, got %d: %s", settingsResponse.Code, settingsResponse.Body.String())
	}
	var settings store.Settings
	if err := json.NewDecoder(settingsResponse.Body).Decode(&settings); err != nil {
		t.Fatal(err)
	}
	if !settings.MarketingEmails || settings.DefaultDashboard != "business" || settings.SidebarBehavior != "collapsed" || settings.BillingPlan != "Enterprise" || settings.CardLastFour != "8675" || settings.CardExpiry != "12/30" {
		t.Fatalf("settings were not preserved: %+v", settings)
	}
}

func TestAPIStrictlySeparatesCreateAndUpdate(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))
	authBody := bytes.NewBufferString(`{"email":"admin@example.com","password":"Spartan300"}`)
	signIn := httptest.NewRecorder()
	handler.ServeHTTP(signIn, httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", authBody))
	cookie := signIn.Result().Cookies()[0]

	create := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(`{"id":"tsk_01","title":"A distinct task","status":"todo","label":"feature","priority":"high"}`))
	create.AddCookie(cookie)
	created := httptest.NewRecorder()
	handler.ServeHTTP(created, create)
	if created.Code != http.StatusCreated {
		t.Fatalf("create with client id: want 201, got %d: %s", created.Code, created.Body.String())
	}
	var task store.Task
	if err := json.NewDecoder(created.Body).Decode(&task); err != nil {
		t.Fatal(err)
	}
	if task.ID == "tsk_01" {
		t.Fatal("create trusted a client-supplied id")
	}

	update := httptest.NewRequest(http.MethodPut, "/api/tasks/missing", bytes.NewBufferString(`{"title":"Must not be created","status":"todo","label":"feature","priority":"high"}`))
	update.AddCookie(cookie)
	updated := httptest.NewRecorder()
	handler.ServeHTTP(updated, update)
	if updated.Code != http.StatusNotFound {
		t.Fatalf("update missing task: want 404, got %d: %s", updated.Code, updated.Body.String())
	}
}

func TestAPIRejectsAmbiguousJSONAndUntrustedOrigins(t *testing.T) {
	handler := api.New(store.New(), slog.New(slog.NewTextHandler(io.Discard, nil)))

	trailing := httptest.NewRecorder()
	handler.ServeHTTP(trailing, httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", bytes.NewBufferString(`{"email":"admin@example.com","password":"Spartan300"}{}`)))
	if trailing.Code != http.StatusBadRequest {
		t.Fatalf("trailing JSON: want 400, got %d", trailing.Code)
	}

	crossOriginRequest := httptest.NewRequest(http.MethodPost, "/api/auth/sign-in", bytes.NewBufferString(`{"email":"admin@example.com","password":"Spartan300"}`))
	crossOriginRequest.Header.Set("Origin", "https://malicious.example")
	crossOrigin := httptest.NewRecorder()
	handler.ServeHTTP(crossOrigin, crossOriginRequest)
	if crossOrigin.Code != http.StatusForbidden {
		t.Fatalf("untrusted origin: want 403, got %d", crossOrigin.Code)
	}

	weakPassword := httptest.NewRecorder()
	handler.ServeHTTP(weakPassword, httptest.NewRequest(http.MethodPost, "/api/auth/sign-up", bytes.NewBufferString(`{"name":"Test","email":"test@example.com","password":"alllowercase"}`)))
	if weakPassword.Code != http.StatusBadRequest {
		t.Fatalf("weak password: want 400, got %d", weakPassword.Code)
	}
}
