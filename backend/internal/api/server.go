package api

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/mail"
	"net/url"
	"slices"
	"strings"
	"time"
	"unicode"

	"spartan-admin/internal/store"
)

const sessionCookie = "spartan_session"

type Server struct {
	store  *store.Store
	logger *slog.Logger
}

func New(data *store.Store, logger *slog.Logger) http.Handler {
	s := &Server{store: data, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.health)
	mux.HandleFunc("POST /api/auth/sign-in", s.signIn)
	mux.HandleFunc("POST /api/auth/sign-up", s.signUp)
	mux.HandleFunc("POST /api/auth/reset-password", s.resetPassword)
	mux.HandleFunc("GET /api/auth/session", s.session)
	mux.HandleFunc("POST /api/auth/sign-out", s.signOut)
	mux.HandleFunc("GET /api/dashboard", s.dashboard)
	mux.HandleFunc("GET /api/dashboard/export", s.exportDashboard)
	mux.HandleFunc("GET /api/users", s.users)
	mux.HandleFunc("POST /api/users", s.saveUser)
	mux.HandleFunc("PUT /api/users/{id}", s.saveUser)
	mux.HandleFunc("DELETE /api/users/{id}", s.deleteUser)
	mux.HandleFunc("GET /api/tasks", s.tasks)
	mux.HandleFunc("POST /api/tasks", s.saveTask)
	mux.HandleFunc("PUT /api/tasks/{id}", s.saveTask)
	mux.HandleFunc("DELETE /api/tasks/{id}", s.deleteTask)
	mux.HandleFunc("GET /api/kanban", s.kanban)
	mux.HandleFunc("POST /api/kanban", s.saveKanban)
	mux.HandleFunc("PUT /api/kanban/{id}", s.saveKanban)
	mux.HandleFunc("DELETE /api/kanban/{id}", s.deleteKanban)
	mux.HandleFunc("GET /api/calendar/events", s.events)
	mux.HandleFunc("POST /api/calendar/events", s.saveEvent)
	mux.HandleFunc("PUT /api/calendar/events/{id}", s.saveEvent)
	mux.HandleFunc("DELETE /api/calendar/events/{id}", s.deleteEvent)
	mux.HandleFunc("GET /api/mail", s.mails)
	mux.HandleFunc("POST /api/mail", s.sendMail)
	mux.HandleFunc("PATCH /api/mail/{id}", s.markMail)
	mux.HandleFunc("GET /api/chats", s.chats)
	mux.HandleFunc("POST /api/chats/{id}/messages", s.addMessage)
	mux.HandleFunc("GET /api/transactions", s.transactions)
	mux.HandleFunc("GET /api/transactions/export", s.exportTransactions)
	mux.HandleFunc("PATCH /api/transactions/{id}", s.updateTransaction)
	mux.HandleFunc("GET /api/settings", s.settings)
	mux.HandleFunc("PUT /api/settings", s.saveSettings)
	mux.HandleFunc("GET /api/billing/invoices/{id}", s.downloadInvoice)
	mux.HandleFunc("POST /api/ai/chat", s.aiChat)
	return s.middleware(mux)
}

func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		defer func() {
			s.logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(started))
		}()
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if origin := r.Header.Get("Origin"); origin != "" {
			if !allowedOrigin(origin, r) {
				writeError(w, http.StatusForbidden, "origin is not allowed")
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		public := r.URL.Path == "/api/health" || r.URL.Path == "/api/auth/sign-in" || r.URL.Path == "/api/auth/sign-up" || r.URL.Path == "/api/auth/reset-password"
		if strings.HasPrefix(r.URL.Path, "/api/") && !public {
			user, ok := s.authenticatedUser(r)
			if !ok {
				writeError(w, http.StatusUnauthorized, "authentication required")
				return
			}
			if strings.HasPrefix(r.URL.Path, "/api/users") && user.Role != "Owner" && user.Role != "Admin" {
				writeError(w, http.StatusForbidden, "administrator role required")
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func allowedOrigin(origin string, r *http.Request) bool {
	parsed, err := url.Parse(origin)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return false
	}
	return parsed.Host == r.Host || origin == "http://localhost:4200"
}

func (s *Server) authenticatedUser(r *http.Request) (store.User, bool) {
	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		return store.User{}, false
	}
	return s.store.SessionUser(cookie.Value)
}

func decode[T any](w http.ResponseWriter, r *http.Request) (T, bool) {
	var value T
	defer r.Body.Close()
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&value); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return value, false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "request body must contain exactly one JSON value")
		return value, false
	}
	return value, true
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
func requireText(value, field string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s is required", field)
	}
	return nil
}

func validEmail(value string) bool {
	trimmed := strings.TrimSpace(value)
	address, err := mail.ParseAddress(trimmed)
	return err == nil && strings.EqualFold(address.Address, trimmed)
}

func validPassword(value string) bool {
	var lower, upper, digit, special bool
	for _, character := range value {
		switch {
		case unicode.IsLower(character):
			lower = true
		case unicode.IsUpper(character):
			upper = true
		case unicode.IsDigit(character):
			digit = true
		case strings.ContainsRune("!@#$%^&*", character):
			special = true
		default:
			return false
		}
	}
	return len(value) >= 8 && lower && upper && digit && special
}

func sessionCookieFor(r *http.Request, token string, maxAge int) *http.Cookie {
	return &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAge,
		Secure:   r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https"),
	}
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "spartan-admin-api"})
}

func (s *Server) signIn(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}](w, r)
	if !ok {
		return
	}
	u, ok := s.store.Authenticate(body.Email, body.Password)
	if !ok {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	token := s.store.NewSession(u.ID)
	http.SetCookie(w, sessionCookieFor(r, token, 86400*7))
	writeJSON(w, http.StatusOK, u)
}

func (s *Server) signUp(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}](w, r)
	if !ok {
		return
	}
	if requireText(body.Name, "name") != nil || !validEmail(body.Email) || !validPassword(body.Password) {
		writeError(w, http.StatusBadRequest, "provide a name, valid email, and password with uppercase, lowercase, number, and special character")
		return
	}
	u, err := s.store.Register(body.Name, body.Email, body.Password)
	if err != nil {
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	token := s.store.NewSession(u.ID)
	http.SetCookie(w, sessionCookieFor(r, token, 86400*7))
	writeJSON(w, http.StatusCreated, u)
}

func (s *Server) resetPassword(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Email string `json:"email"`
	}](w, r)
	if !ok {
		return
	}
	if !validEmail(body.Email) {
		writeError(w, http.StatusBadRequest, "valid email is required")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "If that account exists, a reset link has been queued."})
}
func (s *Server) session(w http.ResponseWriter, r *http.Request) {
	u, ok := s.authenticatedUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	writeJSON(w, http.StatusOK, u)
}
func (s *Server) signOut(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		s.store.RevokeSession(c.Value)
	}
	http.SetCookie(w, sessionCookieFor(r, "", -1))
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) dashboard(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Dashboard())
}
func (s *Server) exportDashboard(w http.ResponseWriter, _ *http.Request) {
	dashboard := s.store.Dashboard()
	months := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	rows := [][]string{{"month", "revenue"}}
	for index, month := range months {
		rows = append(rows, []string{month, fmt.Sprintf("%.2f", dashboard.Series[index])})
	}
	writeCSV(w, "dashboard-report.csv", rows)
}
func (s *Server) users(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Users())
}
func (s *Server) saveUser(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[store.User](w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodPost {
		body.ID = ""
	} else {
		body.ID = r.PathValue("id")
	}
	if requireText(body.Name, "name") != nil || !validEmail(body.Email) {
		writeError(w, http.StatusBadRequest, "name and valid email are required")
		return
	}
	if !oneOf(body.Role, "Owner", "Admin", "Editor", "Viewer") || !oneOf(body.Status, "active", "invited", "suspended") {
		writeError(w, http.StatusBadRequest, "valid role and status are required")
		return
	}
	actor, _ := s.authenticatedUser(r)
	if body.Role == "Owner" && actor.Role != "Owner" {
		writeError(w, http.StatusForbidden, "only an owner can assign the owner role")
		return
	}
	if body.ID != "" && actor.Role != "Owner" {
		if existing, found := s.store.User(body.ID); found && existing.Role == "Owner" {
			writeError(w, http.StatusForbidden, "only an owner can modify an owner account")
			return
		}
	}
	status := http.StatusOK
	if body.ID == "" {
		status = http.StatusCreated
	}
	saved, err := s.store.SaveUser(body)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "email is already registered")
		return
	}
	writeJSON(w, status, saved)
}
func (s *Server) deleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	actor, _ := s.authenticatedUser(r)
	if existing, found := s.store.User(id); found && existing.Role == "Owner" && actor.Role != "Owner" {
		writeError(w, http.StatusForbidden, "only an owner can delete an owner account")
		return
	}
	if err := s.store.DeleteUser(id); err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) tasks(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Tasks())
}
func (s *Server) saveTask(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[store.Task](w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodPost {
		body.ID = ""
	} else {
		body.ID = r.PathValue("id")
	}
	if err := requireText(body.Title, "title"); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !oneOf(body.Status, "backlog", "todo", "in_progress", "done") || !oneOf(body.Priority, "high", "medium", "low") || !oneOf(body.Label, "feature", "bug", "documentation") {
		writeError(w, http.StatusBadRequest, "valid task status, priority, and label are required")
		return
	}
	status := http.StatusOK
	if body.ID == "" {
		status = http.StatusCreated
	}
	saved, err := s.store.SaveTask(body)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	writeJSON(w, status, saved)
}
func (s *Server) deleteTask(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteTask(r.PathValue("id")); err != nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) kanban(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Kanban())
}
func (s *Server) saveKanban(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[store.KanbanTask](w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodPost {
		body.ID = ""
	} else {
		body.ID = r.PathValue("id")
	}
	if err := requireText(body.Title, "title"); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !oneOf(body.Status, "todo", "in_progress", "done") || !oneOf(body.Priority, "high", "medium", "low") {
		writeError(w, http.StatusBadRequest, "valid kanban status and priority are required")
		return
	}
	status := http.StatusOK
	if body.ID == "" {
		status = http.StatusCreated
	}
	saved, err := s.store.SaveKanban(body)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "kanban task not found")
		return
	}
	writeJSON(w, status, saved)
}
func (s *Server) deleteKanban(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteKanban(r.PathValue("id")); err != nil {
		writeError(w, http.StatusNotFound, "kanban task not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) events(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Events())
}
func (s *Server) saveEvent(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[store.CalendarEvent](w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodPost {
		body.ID = ""
	} else {
		body.ID = r.PathValue("id")
	}
	if err := requireText(body.Title, "title"); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !oneOf(body.Type, "meeting", "event", "personal", "task", "reminder") || requireText(body.Calendar, "calendar") != nil || body.StartsAt.IsZero() {
		writeError(w, http.StatusBadRequest, "valid event type and calendar are required")
		return
	}
	status := http.StatusOK
	if body.ID == "" {
		status = http.StatusCreated
	}
	saved, err := s.store.SaveEvent(body)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	writeJSON(w, status, saved)
}
func (s *Server) deleteEvent(w http.ResponseWriter, r *http.Request) {
	if err := s.store.DeleteEvent(r.PathValue("id")); err != nil {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) mails(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Mails())
}
func (s *Server) sendMail(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		To      string `json:"to"`
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}](w, r)
	if !ok {
		return
	}
	if !strings.Contains(body.To, "@") || requireText(body.Subject, "subject") != nil || requireText(body.Body, "body") != nil {
		writeError(w, http.StatusBadRequest, "recipient, subject, and body are required")
		return
	}
	writeJSON(w, http.StatusCreated, s.store.SendMail(body.To, body.Subject, body.Body))
}
func (s *Server) markMail(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Read   *bool   `json:"read"`
		Folder *string `json:"folder"`
	}](w, r)
	if !ok {
		return
	}
	if body.Read == nil && body.Folder == nil {
		writeError(w, http.StatusBadRequest, "read or folder is required")
		return
	}
	if body.Folder != nil && !oneOf(*body.Folder, "Inbox", "Drafts", "Sent", "Junk", "Trash", "Archive") {
		writeError(w, http.StatusBadRequest, "valid mail folder is required")
		return
	}
	mail, err := s.store.UpdateMail(r.PathValue("id"), body.Read, body.Folder)
	if err != nil {
		writeError(w, http.StatusNotFound, "mail not found")
		return
	}
	writeJSON(w, http.StatusOK, mail)
}
func (s *Server) chats(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Conversations())
}
func (s *Server) addMessage(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Text string `json:"text"`
	}](w, r)
	if !ok {
		return
	}
	if err := requireText(body.Text, "text"); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	message, err := s.store.AddMessage(r.PathValue("id"), body.Text)
	if err != nil {
		writeError(w, http.StatusNotFound, "conversation not found")
		return
	}
	writeJSON(w, http.StatusCreated, message)
}
func (s *Server) transactions(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Transactions())
}

func (s *Server) updateTransaction(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Status string `json:"status"`
	}](w, r)
	if !ok {
		return
	}
	if !oneOf(body.Status, "completed", "processing", "pending", "failed", "refunded", "disputed") {
		writeError(w, http.StatusBadRequest, "valid transaction status is required")
		return
	}
	transaction, err := s.store.UpdateTransactionStatus(r.PathValue("id"), body.Status)
	if err != nil {
		writeError(w, http.StatusNotFound, "transaction not found")
		return
	}
	writeJSON(w, http.StatusOK, transaction)
}
func (s *Server) exportTransactions(w http.ResponseWriter, _ *http.Request) {
	rows := [][]string{{"reference", "customer", "amount", "status", "method", "gateway", "country"}}
	for _, transaction := range s.store.Transactions() {
		rows = append(rows, []string{transaction.Reference, transaction.Customer, fmt.Sprintf("%.2f", transaction.Amount), transaction.Status, transaction.Method, transaction.Gateway, transaction.Country})
	}
	writeCSV(w, "transactions.csv", rows)
}
func (s *Server) settings(w http.ResponseWriter, r *http.Request) {
	user, _ := s.authenticatedUser(r)
	settings, ok := s.store.Settings(user.ID)
	if !ok {
		writeError(w, http.StatusNotFound, "settings not found")
		return
	}
	writeJSON(w, http.StatusOK, settings)
}
func (s *Server) saveSettings(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[store.Settings](w, r)
	if !ok {
		return
	}
	if requireText(body.Name, "name") != nil || !validEmail(body.Email) || !oneOf(body.Language, "English", "German", "French", "Japanese") || !oneOf(body.Theme, "light", "dark", "system") || !oneOf(body.DefaultDashboard, "analytics", "business", "payments") || !oneOf(body.SidebarBehavior, "remember", "expanded", "collapsed") || !oneOf(body.BillingPlan, "Starter", "Professional", "Enterprise") || !validCardMetadata(body.CardLastFour, body.CardExpiry) {
		writeError(w, http.StatusBadRequest, "settings contain invalid values")
		return
	}
	user, _ := s.authenticatedUser(r)
	saved, err := s.store.SaveSettings(user.ID, body)
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "email is already registered")
		return
	}
	if err != nil {
		writeError(w, http.StatusNotFound, "settings not found")
		return
	}
	writeJSON(w, http.StatusOK, saved)
}

func (s *Server) downloadInvoice(w http.ResponseWriter, r *http.Request) {
	invoices := map[string]struct {
		date   string
		amount string
	}{
		"INV-2026-008": {date: "Aug 1, 2026", amount: "$522.00"},
		"INV-2026-007": {date: "Jul 1, 2026", amount: "$493.00"},
		"INV-2026-006": {date: "Jun 1, 2026", amount: "$493.00"},
	}
	id := r.PathValue("id")
	invoice, ok := invoices[id]
	if !ok {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}
	user, _ := s.authenticatedUser(r)
	settings, ok := s.store.Settings(user.ID)
	if !ok {
		writeError(w, http.StatusNotFound, "settings not found")
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.txt"`, id))
	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprintf(w, "Spartan Admin\n%s\nDate: %s\nAmount: %s\nPlan: %s\nStatus: Paid\n", id, invoice.date, invoice.amount, settings.BillingPlan)
}
func (s *Server) aiChat(w http.ResponseWriter, r *http.Request) {
	body, ok := decode[struct {
		Prompt string `json:"prompt"`
		Model  string `json:"model"`
	}](w, r)
	if !ok {
		return
	}
	if err := requireText(body.Prompt, "prompt"); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	model := body.Model
	if model == "" {
		model = "balanced"
	}
	reply := fmt.Sprintf("Here is a %s analysis of your request:\n\n%s\n\nBased on the current demo data, revenue is $45,231.89 with 2,350 active subscriptions. I can help turn this into a report, action list, or customer-facing update.", model, body.Prompt)
	writeJSON(w, http.StatusOK, map[string]string{"reply": reply})
}

func oneOf(value string, allowed ...string) bool {
	return slices.Contains(allowed, value)
}

func validCardMetadata(lastFour, expiry string) bool {
	if lastFour == "" && expiry == "" {
		return true
	}
	if len(lastFour) != 4 || len(expiry) != 5 || expiry[2] != '/' {
		return false
	}
	for _, character := range lastFour + expiry[:2] + expiry[3:] {
		if character < '0' || character > '9' {
			return false
		}
	}
	return expiry[:2] >= "01" && expiry[:2] <= "12"
}

func writeCSV(w http.ResponseWriter, filename string, rows [][]string) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	writer := csv.NewWriter(w)
	_ = writer.WriteAll(rows)
}
