package store

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func TestPasswordsUseArgon2id(t *testing.T) {
	s := New()

	s.mu.RLock()
	hash := s.users[0].PasswordHash
	s.mu.RUnlock()

	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Fatalf("password hash is not Argon2id: %q", hash)
	}
	if _, ok := s.Authenticate("admin@example.com", "Spartan300"); !ok {
		t.Fatal("valid password was rejected")
	}
	if _, ok := s.Authenticate("admin@example.com", "Admin123!@#"); ok {
		t.Fatal("previous seeded admin password was accepted")
	}
	if _, ok := s.Authenticate("admin@example.com", "incorrect-password"); ok {
		t.Fatal("invalid password was accepted")
	}
}

func TestRegisterStoresArgon2idHash(t *testing.T) {
	s := New()
	created, err := s.Register("Ada Lovelace", "ada@example.com", "correct horse battery staple")
	if err != nil {
		t.Fatalf("register user: %v", err)
	}
	if created.PasswordHash != "" {
		t.Fatal("public user exposed its password hash")
	}

	s.mu.RLock()
	hash := s.users[len(s.users)-1].PasswordHash
	s.mu.RUnlock()
	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Fatalf("registered password hash is not Argon2id: %q", hash)
	}
	if _, ok := s.Authenticate("ada@example.com", "correct horse battery staple"); !ok {
		t.Fatal("registered user could not authenticate")
	}
}

func TestEventsAlwaysReturnIndependentAttendeeArrays(t *testing.T) {
	s := New()
	events := s.Events()
	for _, event := range events {
		if event.Attendees == nil {
			t.Fatalf("event %q returned null attendees", event.Title)
		}
	}

	events[0].Attendees[0] = "changed"
	if s.Events()[0].Attendees[0] == "changed" {
		t.Fatal("mutating returned attendees changed store state")
	}

	saved, err := s.SaveEvent(CalendarEvent{Title: "No attendees", Type: "task", Calendar: "Work"})
	if err != nil {
		t.Fatalf("save event: %v", err)
	}
	if saved.Attendees == nil {
		t.Fatal("saved event returned null attendees")
	}
}

func TestUpdatesDoNotCreateMissingRecords(t *testing.T) {
	s := New()
	if _, err := s.SaveTask(Task{ID: "missing", Title: "Missing"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("save missing task: want ErrNotFound, got %v", err)
	}
	if _, err := s.SaveKanban(KanbanTask{ID: "missing", Title: "Missing"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("save missing kanban card: want ErrNotFound, got %v", err)
	}
	if _, err := s.SaveEvent(CalendarEvent{ID: "missing", Title: "Missing"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("save missing event: want ErrNotFound, got %v", err)
	}
	if _, err := s.SaveUser(User{ID: "missing", Name: "Missing", Email: "missing@example.com"}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("save missing user: want ErrNotFound, got %v", err)
	}
}

func TestSessionsExpireAndAreRevokedForInactiveUsers(t *testing.T) {
	s := New()
	token := s.NewSession("usr_admin")
	s.mu.Lock()
	s.sessions[token] = session{userID: "usr_admin", expiresAt: time.Now().Add(-time.Second)}
	s.mu.Unlock()
	if _, ok := s.SessionUser(token); ok {
		t.Fatal("expired session was accepted")
	}

	token = s.NewSession("usr_admin")
	admin, _ := s.User("usr_admin")
	admin.Status = "suspended"
	if _, err := s.SaveUser(admin); err != nil {
		t.Fatalf("suspend user: %v", err)
	}
	if _, ok := s.SessionUser(token); ok {
		t.Fatal("suspended user's session was accepted")
	}
}

func TestSettingsAreScopedToEachUser(t *testing.T) {
	s := New()
	viewer, err := s.Register("Viewer", "viewer@example.com", "Correct1!")
	if err != nil {
		t.Fatal(err)
	}
	viewerSettings, ok := s.Settings(viewer.ID)
	if !ok {
		t.Fatal("new user has no settings")
	}
	viewerSettings.Theme = "dark"
	if _, err := s.SaveSettings(viewer.ID, viewerSettings); err != nil {
		t.Fatal(err)
	}
	adminSettings, _ := s.Settings("usr_admin")
	if adminSettings.Theme == "dark" {
		t.Fatal("viewer settings changed the administrator settings")
	}
}
