package store

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/alexedwards/argon2id"
)

var (
	ErrConflict = errors.New("conflict")
	ErrNotFound = errors.New("not found")
)

const sessionLifetime = 7 * 24 * time.Hour

type session struct {
	userID    string
	expiresAt time.Time
}

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Avatar       string    `json:"avatar,omitempty"`
	Role         string    `json:"role"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
	LastLogin    time.Time `json:"lastLogin"`
	PasswordHash string    `json:"-"`
}

type Task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	Label     string    `json:"label"`
	Priority  string    `json:"priority"`
	CreatedAt time.Time `json:"createdAt"`
}

type KanbanTask struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Assignee    string `json:"assignee"`
	Priority    string `json:"priority"`
	Status      string `json:"status"`
}

type CalendarEvent struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartsAt    time.Time `json:"startsAt"`
	Type        string    `json:"type"`
	Calendar    string    `json:"calendar"`
	Duration    string    `json:"duration"`
	Location    string    `json:"location"`
	Attendees   []string  `json:"attendees"`
	AllDay      bool      `json:"allDay"`
	Reminder    bool      `json:"reminder"`
}

type Mail struct {
	ID      string    `json:"id"`
	Name    string    `json:"name"`
	Email   string    `json:"email"`
	Subject string    `json:"subject"`
	Text    string    `json:"text"`
	Date    time.Time `json:"date"`
	Read    bool      `json:"read"`
	Labels  []string  `json:"labels"`
	Folder  string    `json:"folder"`
}

type Message struct {
	ID        string    `json:"id"`
	Sender    string    `json:"sender"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
	Mine      bool      `json:"mine"`
}

type Conversation struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Status   string    `json:"status"`
	Unread   int       `json:"unread"`
	Messages []Message `json:"messages"`
}

type Transaction struct {
	ID          string    `json:"id"`
	Reference   string    `json:"reference"`
	Customer    string    `json:"customer"`
	Email       string    `json:"email"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Status      string    `json:"status"`
	Method      string    `json:"method"`
	Gateway     string    `json:"gateway"`
	Country     string    `json:"country"`
	CreatedAt   time.Time `json:"createdAt"`
	Fee         float64   `json:"fee"`
	RiskScore   int       `json:"riskScore"`
	Description string    `json:"description"`
}

type Settings struct {
	Name                 string `json:"name"`
	Email                string `json:"email"`
	Bio                  string `json:"bio"`
	Language             string `json:"language"`
	Theme                string `json:"theme"`
	Compact              bool   `json:"compact"`
	MarketingEmails      bool   `json:"marketingEmails"`
	SecurityEmails       bool   `json:"securityEmails"`
	CommunicationEmails  bool   `json:"communicationEmails"`
	MobileNotifications  bool   `json:"mobileNotifications"`
	DesktopNotifications bool   `json:"desktopNotifications"`
	DefaultDashboard     string `json:"defaultDashboard"`
	SidebarBehavior      string `json:"sidebarBehavior"`
	BillingPlan          string `json:"billingPlan"`
	CardLastFour         string `json:"cardLastFour"`
	CardExpiry           string `json:"cardExpiry"`
}

type Dashboard struct {
	Revenue       float64       `json:"revenue"`
	Subscriptions int           `json:"subscriptions"`
	ActiveUsers   int           `json:"activeUsers"`
	Conversion    float64       `json:"conversion"`
	Series        []float64     `json:"series"`
	Transactions  []Transaction `json:"transactions"`
}

type Store struct {
	mu            sync.RWMutex
	users         []User
	tasks         []Task
	kanban        []KanbanTask
	events        []CalendarEvent
	mails         []Mail
	conversations []Conversation
	transactions  []Transaction
	settings      map[string]Settings
	sessions      map[string]session
}

func New() *Store {
	s := &Store{settings: make(map[string]Settings), sessions: make(map[string]session)}
	s.seed()
	return s
}

func newID(prefix string) string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
	}
	return prefix + "_" + base64.RawURLEncoding.EncodeToString(b)
}

func hashPassword(password string) (string, error) {
	return argon2id.CreateHash(password, argon2id.DefaultParams)
}

func publicUser(u User) User {
	u.PasswordHash = ""
	return u
}

func (s *Store) Authenticate(email, password string) (User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.users {
		if !strings.EqualFold(s.users[i].Email, strings.TrimSpace(email)) {
			continue
		}
		if s.users[i].Status != "active" {
			return User{}, false
		}
		match, err := argon2id.ComparePasswordAndHash(password, s.users[i].PasswordHash)
		if err != nil || !match {
			return User{}, false
		}
		s.users[i].LastLogin = time.Now().UTC()
		return publicUser(s.users[i]), true
	}
	return User{}, false
}

func (s *Store) Register(name, email, password string) (User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, u := range s.users {
		if strings.EqualFold(u.Email, strings.TrimSpace(email)) {
			return User{}, errors.New("email is already registered")
		}
	}
	hash, err := hashPassword(password)
	if err != nil {
		return User{}, err
	}
	now := time.Now().UTC()
	u := User{ID: newID("usr"), Name: strings.TrimSpace(name), Email: strings.ToLower(strings.TrimSpace(email)), Role: "Viewer", Status: "active", CreatedAt: now, LastLogin: now, PasswordHash: hash}
	s.users = append(s.users, u)
	s.settings[u.ID] = defaultSettings(u)
	return publicUser(u), nil
}

func (s *Store) NewSession(userID string) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	token := newID("ses")
	s.sessions[token] = session{userID: userID, expiresAt: time.Now().UTC().Add(sessionLifetime)}
	return token
}

func (s *Store) RevokeSession(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
}

func (s *Store) SessionUser(token string) (User, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	current, ok := s.sessions[token]
	if !ok || !time.Now().UTC().Before(current.expiresAt) {
		delete(s.sessions, token)
		return User{}, false
	}
	for _, u := range s.users {
		if u.ID == current.userID && u.Status == "active" {
			return publicUser(u), true
		}
	}
	delete(s.sessions, token)
	return User{}, false
}

func (s *Store) Users() []User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]User, len(s.users))
	for i, u := range s.users {
		result[i] = publicUser(u)
	}
	return result
}

func (s *Store) User(id string) (User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, user := range s.users {
		if user.ID == id {
			return publicUser(user), true
		}
	}
	return User{}, false
}

func (s *Store) SaveUser(user User) (User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	user.Name = strings.TrimSpace(user.Name)
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	for _, existing := range s.users {
		if existing.ID != user.ID && strings.EqualFold(existing.Email, user.Email) {
			return User{}, ErrConflict
		}
	}
	for i := range s.users {
		if s.users[i].ID == user.ID {
			user.PasswordHash = s.users[i].PasswordHash
			user.CreatedAt = s.users[i].CreatedAt
			user.LastLogin = s.users[i].LastLogin
			s.users[i] = user
			if preferences, ok := s.settings[user.ID]; ok {
				preferences.Name = user.Name
				preferences.Email = user.Email
				s.settings[user.ID] = preferences
			}
			if user.Status != "active" {
				s.revokeUserSessions(user.ID)
			}
			return publicUser(user), nil
		}
	}
	if user.ID != "" {
		return User{}, ErrNotFound
	}
	user.ID = newID("usr")
	user.CreatedAt = time.Now().UTC()
	user.LastLogin = user.CreatedAt
	if user.Status == "" {
		user.Status = "active"
	}
	if user.Role == "" {
		user.Role = "Viewer"
	}
	s.users = append(s.users, user)
	s.settings[user.ID] = defaultSettings(user)
	return publicUser(user), nil
}

func (s *Store) DeleteUser(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := slices.IndexFunc(s.users, func(u User) bool { return u.ID == id })
	if i < 0 {
		return ErrNotFound
	}
	s.users = slices.Delete(s.users, i, i+1)
	delete(s.settings, id)
	s.revokeUserSessions(id)
	return nil
}

func (s *Store) revokeUserSessions(userID string) {
	for token, current := range s.sessions {
		if current.userID == userID {
			delete(s.sessions, token)
		}
	}
}

func (s *Store) Tasks() []Task { s.mu.RLock(); defer s.mu.RUnlock(); return slices.Clone(s.tasks) }
func (s *Store) SaveTask(v Task) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.tasks {
		if s.tasks[i].ID == v.ID {
			v.CreatedAt = s.tasks[i].CreatedAt
			s.tasks[i] = v
			return v, nil
		}
	}
	if v.ID != "" {
		return Task{}, ErrNotFound
	}
	v.ID, v.CreatedAt = newID("tsk"), time.Now().UTC()
	s.tasks = append(s.tasks, v)
	return v, nil
}
func (s *Store) DeleteTask(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := slices.IndexFunc(s.tasks, func(v Task) bool { return v.ID == id })
	if i < 0 {
		return ErrNotFound
	}
	s.tasks = slices.Delete(s.tasks, i, i+1)
	return nil
}

func (s *Store) Kanban() []KanbanTask {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return slices.Clone(s.kanban)
}
func (s *Store) SaveKanban(v KanbanTask) (KanbanTask, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.kanban {
		if s.kanban[i].ID == v.ID {
			s.kanban[i] = v
			return v, nil
		}
	}
	if v.ID != "" {
		return KanbanTask{}, ErrNotFound
	}
	v.ID = newID("kan")
	s.kanban = append(s.kanban, v)
	return v, nil
}
func (s *Store) DeleteKanban(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := slices.IndexFunc(s.kanban, func(v KanbanTask) bool { return v.ID == id })
	if i < 0 {
		return ErrNotFound
	}
	s.kanban = slices.Delete(s.kanban, i, i+1)
	return nil
}

func (s *Store) Events() []CalendarEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := slices.Clone(s.events)
	for i := range result {
		result[i].Attendees = cloneAttendees(result[i].Attendees)
	}
	return result
}
func (s *Store) SaveEvent(v CalendarEvent) (CalendarEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v.Attendees = cloneAttendees(v.Attendees)
	for i := range s.events {
		if s.events[i].ID == v.ID {
			s.events[i] = v
			return v, nil
		}
	}
	if v.ID != "" {
		return CalendarEvent{}, ErrNotFound
	}
	v.ID = newID("evt")
	s.events = append(s.events, v)
	return v, nil
}

func cloneAttendees(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	return slices.Clone(values)
}
func (s *Store) DeleteEvent(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := slices.IndexFunc(s.events, func(v CalendarEvent) bool { return v.ID == id })
	if i < 0 {
		return ErrNotFound
	}
	s.events = slices.Delete(s.events, i, i+1)
	return nil
}

func (s *Store) Mails() []Mail {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := slices.Clone(s.mails)
	for i := range result {
		result[i].Labels = slices.Clone(result[i].Labels)
	}
	return result
}
func (s *Store) MarkMail(id string, read bool) (Mail, error) {
	return s.UpdateMail(id, &read, nil)
}

func (s *Store) UpdateMail(id string, read *bool, folder *string) (Mail, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.mails {
		if s.mails[i].ID == id {
			if read != nil {
				s.mails[i].Read = *read
			}
			if folder != nil {
				s.mails[i].Folder = *folder
			}
			return s.mails[i], nil
		}
	}
	return Mail{}, ErrNotFound
}
func (s *Store) SendMail(to, subject, text string) Mail {
	s.mu.Lock()
	defer s.mu.Unlock()
	recipient := strings.TrimSpace(to)
	name, _, _ := strings.Cut(recipient, "@")
	mail := Mail{
		ID:      newID("mail"),
		Name:    name,
		Email:   strings.ToLower(recipient),
		Subject: strings.TrimSpace(subject),
		Text:    strings.TrimSpace(text),
		Date:    time.Now().UTC(),
		Read:    true,
		Labels:  []string{},
		Folder:  "Sent",
	}
	s.mails = append([]Mail{mail}, s.mails...)
	return mail
}

func (s *Store) Conversations() []Conversation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := slices.Clone(s.conversations)
	for i := range result {
		result[i].Messages = slices.Clone(result[i].Messages)
	}
	return result
}
func (s *Store) AddMessage(id, text string) (Message, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.conversations {
		if s.conversations[i].ID == id {
			m := Message{ID: newID("msg"), Sender: "You", Text: text, CreatedAt: time.Now().UTC(), Mine: true}
			s.conversations[i].Messages = append(s.conversations[i].Messages, m)
			s.conversations[i].Unread = 0
			return m, nil
		}
	}
	return Message{}, ErrNotFound
}

func (s *Store) Transactions() []Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return slices.Clone(s.transactions)
}

func (s *Store) UpdateTransactionStatus(id, status string) (Transaction, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.transactions {
		if s.transactions[i].ID == id {
			s.transactions[i].Status = status
			return s.transactions[i], nil
		}
	}
	return Transaction{}, ErrNotFound
}
func (s *Store) Settings(userID string) (Settings, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if preferences, ok := s.settings[userID]; ok {
		return preferences, true
	}
	for _, user := range s.users {
		if user.ID == userID {
			return defaultSettings(user), true
		}
	}
	return Settings{}, false
}
func (s *Store) SaveSettings(userID string, v Settings) (Settings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v.Name = strings.TrimSpace(v.Name)
	v.Email = strings.ToLower(strings.TrimSpace(v.Email))
	userIndex := slices.IndexFunc(s.users, func(user User) bool { return user.ID == userID })
	if userIndex < 0 {
		return Settings{}, ErrNotFound
	}
	for _, user := range s.users {
		if user.ID != userID && strings.EqualFold(user.Email, v.Email) {
			return Settings{}, ErrConflict
		}
	}
	s.users[userIndex].Name = v.Name
	s.users[userIndex].Email = v.Email
	s.settings[userID] = v
	return v, nil
}
func (s *Store) Dashboard() Dashboard {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return Dashboard{Revenue: 45231.89, Subscriptions: 2350, ActiveUsers: 573, Conversion: 12.5, Series: []float64{1860, 2210, 1940, 2780, 3100, 2920, 3650, 4100, 3860, 4480, 5020, 5630}, Transactions: slices.Clone(s.transactions[:min(6, len(s.transactions))])}
}

func (s *Store) seed() {
	now := time.Now().UTC()
	hash, err := hashPassword("Spartan300")
	if err != nil {
		panic(fmt.Sprintf("hash demo password: %v", err))
	}
	s.users = []User{
		{ID: "usr_admin", Name: "Nyein Phyo", Email: "admin@example.com", Role: "Owner", Status: "active", CreatedAt: now.AddDate(-2, 0, 0), LastLogin: now, PasswordHash: hash},
		{ID: "usr_aiko", Name: "Aiko Kimura", Email: "aiko@example.com", Role: "Admin", Status: "active", CreatedAt: now.AddDate(-1, -4, 0), LastLogin: now.Add(-2 * time.Hour)},
		{ID: "usr_marco", Name: "Marco Rossi", Email: "marco@example.com", Role: "Editor", Status: "invited", CreatedAt: now.AddDate(0, -9, 0), LastLogin: now.AddDate(0, -2, 0)},
		{ID: "usr_sara", Name: "Sara Diallo", Email: "sara@example.com", Role: "Viewer", Status: "active", CreatedAt: now.AddDate(0, -7, 0), LastLogin: now.Add(-26 * time.Hour)},
		{ID: "usr_liam", Name: "Liam Chen", Email: "liam@example.com", Role: "Editor", Status: "suspended", CreatedAt: now.AddDate(0, -5, 0), LastLogin: now.AddDate(0, -1, 0)},
	}
	titles := []string{"Update documentation", "Fix navigation bug", "Implement authentication", "Refactor API client", "Add billing dashboard", "Review pull requests", "Optimize image loading", "Prepare release notes", "Migrate analytics events", "Audit accessibility"}
	statuses := []string{"in_progress", "todo", "done", "backlog"}
	priorities := []string{"high", "medium", "low"}
	labels := []string{"documentation", "bug", "feature"}
	for i, title := range titles {
		s.tasks = append(s.tasks, Task{ID: fmt.Sprintf("tsk_%02d", i+1), Title: title, Status: statuses[i%len(statuses)], Priority: priorities[i%len(priorities)], Label: labels[i%len(labels)], CreatedAt: now.AddDate(0, 0, -i)})
	}
	s.kanban = []KanbanTask{
		{ID: "kan_1", Title: "Setup CI/CD Pipeline", Description: "Configure automated deployment with GitHub Actions", Assignee: "Alex Morgan", Priority: "high", Status: "todo"},
		{ID: "kan_2", Title: "Design System Documentation", Description: "Document tokens and reusable components", Assignee: "Jordan Lee", Priority: "medium", Status: "todo"},
		{ID: "kan_3", Title: "API Integration", Description: "Integrate payment gateway API", Assignee: "Taylor Reed", Priority: "high", Status: "in_progress"},
		{ID: "kan_4", Title: "Authentication Flow", Description: "Complete session and recovery flows", Assignee: "Casey Brooks", Priority: "high", Status: "in_progress"},
		{ID: "kan_5", Title: "Unit Tests Setup", Description: "Configure unit and browser tests", Assignee: "Morgan Davis", Priority: "low", Status: "done"},
		{ID: "kan_6", Title: "Landing Page Redesign", Description: "Ship the refreshed marketing page", Assignee: "Quinn Foster", Priority: "medium", Status: "done"},
	}
	s.events = []CalendarEvent{
		{ID: "evt_1", Title: "Design review", Description: "Review the new component library", StartsAt: dateThisMonth(now, 3, 10, 0), Type: "meeting", Calendar: "Work", Duration: "1 hour", Location: "Design Studio", Attendees: []string{"AK", "MR"}, Reminder: true},
		{ID: "evt_2", Title: "Product launch", Description: "Public release and team briefing", StartsAt: dateThisMonth(now, 8, 14, 30), Type: "event", Calendar: "Work", Duration: "2 hours", Location: "Main Auditorium", Attendees: []string{"NP", "AK", "MR"}, Reminder: true},
		{ID: "evt_3", Title: "Dentist", Description: "Regular checkup", StartsAt: dateThisMonth(now, 12, 9, 0), Type: "personal", Calendar: "Personal", Duration: "45 min", Location: "Dental Clinic", Reminder: true},
		{ID: "evt_4", Title: "Submit expenses", Description: "Upload the monthly expense report", StartsAt: dateThisMonth(now, 18, 16, 0), Type: "task", Calendar: "Work", Duration: "30 min", Reminder: true},
		{ID: "evt_5", Title: "Team retro", Description: "Monthly retrospective", StartsAt: dateThisMonth(now, 24, 11, 0), Type: "meeting", Calendar: "Shared", Duration: "1 hour", Location: "Conference Room A", Attendees: []string{"NP", "AK", "SD"}, Reminder: true},
	}
	s.mails = []Mail{
		{ID: "mail_1", Name: "Jordan", Email: "jordan@example.com", Subject: "Meeting tomorrow", Text: "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the details and have a few ideas to share. Please come prepared with questions.\n\nBest regards,\nJordan", Date: now.Add(-2 * time.Hour), Read: false, Labels: []string{"meeting", "work", "important"}, Folder: "Inbox"},
		{ID: "mail_2", Name: "Vercel", Email: "vercel@example.com", Subject: "Re: Project update", Text: "Thank you for the project update. It looks great! The progress is impressive and the team has done a fantastic job.\n\nLet's discuss the remaining suggestions during our next meeting.", Date: now.Add(-5 * time.Hour), Read: true, Labels: []string{"work", "important"}, Folder: "Inbox"},
		{ID: "mail_3", Name: "Radix UI", Email: "radix@example.com", Subject: "Weekend plans", Text: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. Let me know if you're interested.", Date: now.AddDate(0, 0, -2), Read: false, Labels: []string{"personal"}, Folder: "Inbox"},
		{ID: "mail_4", Name: "Stripe", Email: "billing@stripe.com", Subject: "Your invoice is ready", Text: "Your monthly invoice is now available. The total of $149.00 will be charged to your default payment method.", Date: now.AddDate(0, 0, -4), Read: true, Labels: []string{"billing", "work"}, Folder: "Inbox"},
	}
	s.conversations = []Conversation{
		{ID: "chat_1", Name: "Aiko Kimura", Status: "online", Unread: 2, Messages: []Message{{ID: "msg_1", Sender: "Aiko Kimura", Text: "Hey! Did you get a chance to review the new dashboard?", CreatedAt: now.Add(-45 * time.Minute)}, {ID: "msg_2", Sender: "You", Text: "Yes, the new metrics section looks excellent.", CreatedAt: now.Add(-41 * time.Minute), Mine: true}, {ID: "msg_3", Sender: "Aiko Kimura", Text: "Great. I'll prepare the release notes.", CreatedAt: now.Add(-38 * time.Minute)}}},
		{ID: "chat_2", Name: "Marco Rossi", Status: "away", Unread: 1, Messages: []Message{{ID: "msg_4", Sender: "Marco Rossi", Text: "Can we sync about the API changes today?", CreatedAt: now.Add(-3 * time.Hour)}}},
		{ID: "chat_3", Name: "Sara Diallo", Status: "offline", Unread: 0, Messages: []Message{{ID: "msg_5", Sender: "Sara Diallo", Text: "The accessibility audit is complete.", CreatedAt: now.AddDate(0, 0, -1)}}},
	}
	customers := []string{"Olivia Martin", "Noah Williams", "Emma Davis", "Liam Johnson", "Sophia Wilson", "Mateo Garcia", "Aisha Hassan", "Hiroshi Tanaka", "Priya Sharma", "Lucas Andersson", "Chen Wei", "Maria Santos"}
	states := []string{"completed", "processing", "pending", "completed", "failed", "refunded", "completed", "disputed"}
	methods := []string{"credit_card", "bank_transfer", "digital_wallet", "ach"}
	gateways := []string{"stripe", "adyen", "paypal", "braintree"}
	countries := []string{"United States", "Canada", "France", "Germany", "India", "Japan"}
	for i, customer := range customers {
		amount := float64(450 + i*735)
		s.transactions = append(s.transactions, Transaction{ID: fmt.Sprintf("txn_%d", i+1), Reference: fmt.Sprintf("PAY-2026-%05d", i+1), Customer: customer, Email: strings.ToLower(strings.ReplaceAll(customer, " ", ".")) + "@example.com", Amount: amount, Currency: "USD", Status: states[i%len(states)], Method: methods[i%len(methods)], Gateway: gateways[i%len(gateways)], Country: countries[i%len(countries)], CreatedAt: now.Add(-time.Duration(i*9) * time.Hour), Fee: amount * 0.029, RiskScore: 3 + i*5, Description: "Professional subscription"})
	}
	adminSettings := defaultSettings(s.users[0])
	adminSettings.Bio = "Building thoughtful software for ambitious teams."
	adminSettings.BillingPlan = "Professional"
	adminSettings.CardLastFour = "4242"
	adminSettings.CardExpiry = "08/29"
	s.settings[s.users[0].ID] = adminSettings
}

func defaultSettings(user User) Settings {
	return Settings{
		Name:                user.Name,
		Email:               user.Email,
		Language:            "English",
		Theme:               "system",
		SecurityEmails:      true,
		CommunicationEmails: true,
		MobileNotifications: true,
		DefaultDashboard:    "analytics",
		SidebarBehavior:     "remember",
		BillingPlan:         "Starter",
	}
}

func dateThisMonth(base time.Time, day, hour, minute int) time.Time {
	return time.Date(base.Year(), base.Month(), day, hour, minute, 0, 0, base.Location())
}
