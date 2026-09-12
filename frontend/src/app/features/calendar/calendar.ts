import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { AdminStore } from '../../core/admin.store';
import { CalendarEvent } from '../../core/models';

type CalendarView = 'month' | 'list';
interface UserCalendar {
  name: string;
  color: string;
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe, HlmButton, HlmInput, HlmTextarea],
  template: `
    <section class="page-heading">
      <div>
        <h1>Calendar</h1>
        <p>Manage your schedule and upcoming events</p>
      </div>
      <button hlmBtn type="button" (click)="openEditor()">+ New event</button>
    </section>
    <div class="metric-grid summary-metrics calendar-metrics">
      @for (metric of metrics(); track metric.title) {
        <article class="metric-card">
          <div class="metric-top">
            <i>{{ metric.icon }}</i
            ><b>+{{ metric.growth }}%</b>
          </div>
          <p>{{ metric.title }}</p>
          <strong>{{ metric.current }}</strong
          ><small>from {{ metric.previous }} &#8599;</small>
        </article>
      }
    </div>

    <section class="panel schedule-panel">
      <div class="panel-header schedule-heading">
        <div>
          <h2>Schedule</h2>
          <p>View and manage your calendar events</p>
        </div>
      </div>
      <div class="calendar-layout" [class.mobile-sidebar-open]="mobileSidebarOpen()">
        <button
          class="calendar-sidebar-scrim"
          type="button"
          aria-label="Close calendars"
          (click)="mobileSidebarOpen.set(false)"
        ></button>
        <aside class="calendar-sidebar">
          <button hlmBtn class="wide-button" type="button" (click)="openEditor()">
            + Add New Event
          </button>
          <div class="mini-month">
            <div>
              <button type="button" aria-label="Previous month" (click)="moveMonth(-1)">
                &#8249;</button
              ><strong>{{ month() | date: 'MMMM y' }}</strong
              ><button type="button" aria-label="Next month" (click)="moveMonth(1)">&#8250;</button>
            </div>
            <div class="mini-weekdays">
              @for (day of weekdays; track day) {
                <span>{{ day.slice(0, 1) }}</span>
              }
            </div>
            <div class="mini-days">
              @for (cell of cells(); track cell.date) {
                <button
                  type="button"
                  [class.muted]="!cell.inMonth"
                  [class.today]="cell.today"
                  [class.has-event]="cell.events.length"
                  (click)="selectDate(cell.date)"
                >
                  {{ cell.day }}
                </button>
              }
            </div>
          </div>
          <div class="calendar-list">
            <div>
              <h3>My calendars</h3>
              <button
                type="button"
                aria-label="Create calendar"
                (click)="calendarDialogOpen.set(true)"
              >
                +
              </button>
            </div>
            @for (calendar of calendars(); track calendar.name) {
              <div>
                <label
                  ><input
                    type="checkbox"
                    [checked]="visibleCalendars().has(calendar.name)"
                    (change)="toggleCalendar(calendar.name)"
                  /><i [style.background]="calendar.color"></i
                  ><span>{{ calendar.name }}</span></label
                >
                @if (!defaultCalendars.has(calendar.name)) {
                  <button
                    type="button"
                    [attr.aria-label]="'Delete ' + calendar.name"
                    (click)="removeCalendar(calendar.name)"
                  >
                    &times;
                  </button>
                }
              </div>
            }
            <button
              hlmBtn
              variant="outline"
              class="wide-button new-calendar-button"
              type="button"
              (click)="calendarDialogOpen.set(true)"
            >
              + New Calendar
            </button>
          </div>
          <div class="upcoming">
            <h3>Upcoming</h3>
            @for (event of upcoming(); track event.id) {
              <button type="button" (click)="openEditor(event)">
                <i [attr.data-type]="event.type"></i
                ><span
                  ><b>{{ event.title }}</b
                  ><small>{{ event.startsAt | date: 'MMM d, HH:mm' }}</small></span
                >
              </button>
            } @empty {
              <p>No upcoming events.</p>
            }
          </div>
        </aside>

        <div class="calendar-main">
          <header>
            <div class="calendar-navigation">
              <button
                hlmBtn
                variant="outline"
                size="sm"
                class="calendar-mobile-menu"
                type="button"
                (click)="mobileSidebarOpen.set(true)"
              >
                &#9776; Calendars</button
              ><button hlmBtn variant="outline" size="sm" type="button" (click)="today()">
                Today</button
              ><button
                hlmBtn
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Previous month"
                (click)="moveMonth(-1)"
              >
                &#8249;</button
              ><button
                hlmBtn
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Next month"
                (click)="moveMonth(1)"
              >
                &#8250;
              </button>
            </div>
            <h2>{{ month() | date: 'MMMM y' }}</h2>
            <div class="calendar-tools">
              <div class="calendar-search">
                <span>&#8981;</span
                ><input
                  hlmInput
                  #searchInput
                  aria-label="Search events"
                  placeholder="Search events..."
                  [value]="query()"
                  (input)="query.set(searchInput.value)"
                />
              </div>
              <div class="view-toggle" role="group" aria-label="Calendar view">
                <button
                  type="button"
                  [class.active]="viewMode() === 'month'"
                  (click)="viewMode.set('month')"
                >
                  Month</button
                ><button
                  type="button"
                  [class.active]="viewMode() === 'list'"
                  (click)="viewMode.set('list')"
                >
                  List
                </button>
              </div>
            </div>
          </header>
          @if (viewMode() === 'month') {
            <div class="weekdays">
              @for (day of weekdays; track day) {
                <span>{{ day }}</span>
              }
            </div>
            <div class="month-grid">
              @for (cell of cells(); track cell.date) {
                <div
                  class="calendar-cell"
                  [class.outside]="!cell.inMonth"
                  [class.today]="cell.today"
                >
                  <button
                    type="button"
                    class="calendar-day"
                    [attr.aria-label]="'Add event on ' + cell.date"
                    (click)="openEditor(undefined, cell.date)"
                  >
                    {{ cell.day }}
                  </button>
                  <div>
                    @for (event of cell.events.slice(0, 2); track event.id) {
                      <button
                        type="button"
                        class="calendar-event"
                        [attr.data-type]="event.type"
                        (click)="openEditor(event)"
                      >
                        <i></i>{{ event.title }}
                        @if (!event.allDay) {
                          <small>{{ event.startsAt | date: 'HH:mm' }}</small>
                        }
                      </button>
                    }
                    @if (cell.events.length > 2) {
                      <button type="button" class="more-events" (click)="viewMode.set('list')">
                        +{{ cell.events.length - 2 }} more
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="calendar-list-view">
              @for (event of listEvents(); track event.id) {
                <button type="button" (click)="openEditor(event)">
                  <i [attr.data-type]="event.type"></i>
                  <div>
                    <strong>{{ event.title }}</strong
                    ><span
                      ><b>&#128197;</b> {{ event.startsAt | date: 'MMM d, y' }} &middot;
                      {{ event.allDay ? 'All day' : (event.startsAt | date: 'HH:mm') }} &middot;
                      {{ event.duration || '1 hour' }}</span
                    >
                    @if (event.location) {
                      <span>Location: {{ event.location }}</span>
                    }
                  </div>
                  <div class="event-attendees">
                    @for (attendee of event.attendees.slice(0, 3); track attendee) {
                      <span>{{ attendee }}</span>
                    }
                  </div>
                  <span class="tag">{{ event.type }}</span>
                </button>
              } @empty {
                <div class="empty-state">No events match your search.</div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    @if (store.notice()) {
      <div class="toast" role="status">&#10003; {{ store.notice() }}</div>
    }
    @if (editorOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog calendar-event-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="event-dialog-title">{{ draftId() ? 'Edit Event' : 'Create New Event' }}</h2>
              <p>
                {{ draftId() ? 'Make changes to this event' : 'Add a new event to your calendar' }}
              </p>
            </div>
            <button type="button" aria-label="Close" (click)="editorOpen.set(false)">
              &times;
            </button>
          </div>
          <form (submit)="save($event)">
            <label for="event-title">Event Title</label
            ><input
              hlmInput
              id="event-title"
              #titleInput
              placeholder="Enter event title..."
              [value]="draftTitle()"
              (input)="draftTitle.set(titleInput.value)"
              required
            />
            <div class="form-row">
              <div>
                <label for="event-type">Event Type</label
                ><select
                  id="event-type"
                  #typeInput
                  [value]="draftType()"
                  (change)="draftType.set(typeInput.value)"
                >
                  <option>meeting</option>
                  <option>event</option>
                  <option>personal</option>
                  <option>task</option>
                  <option>reminder</option>
                </select>
              </div>
              <div>
                <label for="event-calendar">Calendar</label
                ><select
                  id="event-calendar"
                  #calendarInput
                  [value]="draftCalendar()"
                  (change)="draftCalendar.set(calendarInput.value)"
                >
                  @for (calendar of calendars(); track calendar.name) {
                    <option [selected]="draftCalendar() === calendar.name">
                      {{ calendar.name }}
                    </option>
                  }
                </select>
              </div>
            </div>
            <div class="form-row">
              <div>
                <label for="event-time">Date and time</label
                ><input
                  hlmInput
                  id="event-time"
                  type="datetime-local"
                  #timeInput
                  [value]="draftTime()"
                  (input)="draftTime.set(timeInput.value)"
                  required
                />
              </div>
              <div>
                <label for="event-duration">Duration</label
                ><select
                  id="event-duration"
                  #durationInput
                  [value]="draftDuration()"
                  (change)="draftDuration.set(durationInput.value)"
                >
                  @for (duration of durations; track duration) {
                    <option [selected]="draftDuration() === duration">{{ duration }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="event-options">
              <label
                ><input
                  type="checkbox"
                  [checked]="draftAllDay()"
                  (change)="draftAllDay.update((value) => !value)"
                />
                All day</label
              ><label
                ><input
                  type="checkbox"
                  [checked]="draftReminder()"
                  (change)="draftReminder.update((value) => !value)"
                />
                Reminder</label
              >
            </div>
            <label for="event-location">Location</label
            ><input
              hlmInput
              id="event-location"
              #locationInput
              placeholder="Add location..."
              [value]="draftLocation()"
              (input)="draftLocation.set(locationInput.value)"
            /><label for="event-attendee">Attendees</label>
            <div class="attendee-input">
              <input
                hlmInput
                id="event-attendee"
                #attendeeInput
                placeholder="Add attendee initials or name..."
                [value]="newAttendee()"
                (input)="newAttendee.set(attendeeInput.value)"
                (keydown.enter)="addAttendee($event)"
              /><button hlmBtn variant="outline" type="button" (click)="addAttendee()">Add</button>
            </div>
            @if (draftAttendees().length) {
              <div class="attendee-chips">
                @for (attendee of draftAttendees(); track attendee) {
                  <span
                    >{{ attendee
                    }}<button
                      type="button"
                      [attr.aria-label]="'Remove ' + attendee"
                      (click)="removeAttendee(attendee)"
                    >
                      &times;
                    </button></span
                  >
                }
              </div>
            }
            <label for="event-description">Description</label
            ><textarea
              hlmTextarea
              id="event-description"
              #descriptionInput
              placeholder="Add description..."
              [value]="draftDescription()"
              (input)="draftDescription.set(descriptionInput.value)"
            ></textarea>
            <div class="dialog-actions">
              @if (draftId()) {
                <button hlmBtn variant="destructive" type="button" (click)="remove()">
                  Delete
                </button>
              }
              <span></span
              ><button hlmBtn variant="outline" type="button" (click)="editorOpen.set(false)">
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!validDraft()">
                {{ draftId() ? 'Update Event' : 'Create Event' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (calendarDialogOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="calendar-dialog-title">New Calendar</h2>
              <p>Create a separate calendar for your events.</p>
            </div>
            <button type="button" aria-label="Close" (click)="calendarDialogOpen.set(false)">
              &times;
            </button>
          </div>
          <form (submit)="saveCalendar($event)">
            <label for="calendar-name">Name</label
            ><input
              hlmInput
              id="calendar-name"
              #nameInput
              [value]="calendarName()"
              (input)="calendarName.set(nameInput.value)"
              required
            /><label for="calendar-color">Color</label
            ><input
              id="calendar-color"
              type="color"
              #colorInput
              [value]="calendarColor()"
              (input)="calendarColor.set(colorInput.value)"
            />
            <div class="dialog-actions">
              <button
                hlmBtn
                variant="outline"
                type="button"
                (click)="calendarDialogOpen.set(false)"
              >
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!calendarName().trim()">
                Create calendar
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class CalendarPage {
  readonly store = inject(AdminStore);
  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly durations = [
    '15 min',
    '30 min',
    '45 min',
    '1 hour',
    '1.5 hours',
    '2 hours',
    '3 hours',
    'All day',
  ];
  readonly defaultCalendars = new Set(['Personal', 'Work', 'Shared']);
  readonly calendars = signal<UserCalendar[]>([
    { name: 'Personal', color: '#8b5cf6' },
    { name: 'Work', color: '#3b82f6' },
    { name: 'Shared', color: '#22c55e' },
  ]);
  readonly month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedDate = signal(this.dateKey(new Date()));
  readonly visibleCalendars = signal(new Set(this.calendars().map((calendar) => calendar.name)));
  readonly viewMode = signal<CalendarView>('month');
  readonly query = signal('');
  readonly mobileSidebarOpen = signal(false);
  readonly editorOpen = signal(false);
  readonly calendarDialogOpen = signal(false);
  readonly draftId = signal('');
  readonly draftTitle = signal('');
  readonly draftDescription = signal('');
  readonly draftTime = signal('');
  readonly draftType = signal('meeting');
  readonly draftCalendar = signal('Work');
  readonly draftDuration = signal('1 hour');
  readonly draftLocation = signal('');
  readonly draftAttendees = signal<string[]>([]);
  readonly draftAllDay = signal(false);
  readonly draftReminder = signal(true);
  readonly newAttendee = signal('');
  readonly calendarName = signal('');
  readonly calendarColor = signal('#6366f1');
  readonly validDraft = computed(
    () => this.draftTitle().trim().length > 0 && Number.isFinite(Date.parse(this.draftTime())),
  );
  readonly visibleEvents = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.store
      .events()
      .filter(
        (event) =>
          this.visibleCalendars().has(event.calendar) &&
          (!query ||
            `${event.title} ${event.description} ${event.location} ${event.attendees.join(' ')}`
              .toLowerCase()
              .includes(query)),
      );
  });
  readonly cells = computed(() => {
    const month = this.month();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const now = new Date();
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.dateKey(date);
      return {
        day: date.getDate(),
        date: key,
        inMonth: date.getMonth() === month.getMonth(),
        today: this.dateKey(now) === key,
        events: this.visibleEvents().filter(
          (event) => this.dateKey(new Date(event.startsAt)) === key,
        ),
      };
    });
  });
  readonly listEvents = computed(() =>
    [...this.visibleEvents()].sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
  );
  readonly upcoming = computed(() =>
    [...this.visibleEvents().filter((event) => new Date(event.startsAt) >= new Date())]
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      .slice(0, 4),
  );
  readonly metrics = computed(() => {
    const events = this.store.events();
    return [
      {
        title: 'Total Events',
        current: String(events.length),
        previous: '10',
        growth: 40,
        icon: 'EV',
      },
      {
        title: 'Meetings',
        current: String(events.filter((event) => event.type === 'meeting').length),
        previous: '4',
        growth: 25,
        icon: 'ME',
      },
      {
        title: 'Tasks',
        current: String(events.filter((event) => event.type === 'task').length),
        previous: '3',
        growth: 66.7,
        icon: 'TA',
      },
      {
        title: 'Calendars',
        current: String(this.calendars().length),
        previous: '3',
        growth: 66.7,
        icon: 'CA',
      },
    ];
  });
  constructor() {
    void this.store.loadEvents();
  }
  moveMonth(delta: number): void {
    this.month.update((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }
  today(): void {
    const now = new Date();
    this.month.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selectedDate.set(this.dateKey(now));
  }
  selectDate(date: string): void {
    const selected = new Date(`${date}T12:00:00`);
    this.month.set(new Date(selected.getFullYear(), selected.getMonth(), 1));
    this.selectedDate.set(date);
    this.mobileSidebarOpen.set(false);
  }
  toggleCalendar(name: string): void {
    this.visibleCalendars.update((items) => {
      const next = new Set(items);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
  removeCalendar(name: string): void {
    this.calendars.update((items) => items.filter((item) => item.name !== name));
    this.visibleCalendars.update((items) => {
      const next = new Set(items);
      next.delete(name);
      return next;
    });
  }
  saveCalendar(event: Event): void {
    event.preventDefault();
    const name = this.calendarName().trim();
    if (this.calendars().some((calendar) => calendar.name.toLowerCase() === name.toLowerCase()))
      return;
    this.calendars.update((items) => [...items, { name, color: this.calendarColor() }]);
    this.visibleCalendars.update((items) => new Set([...items, name]));
    this.calendarName.set('');
    this.calendarDialogOpen.set(false);
  }
  openEditor(event?: CalendarEvent, date?: string): void {
    const value = event
      ? new Date(event.startsAt)
      : date
        ? new Date(`${date}T09:00:00`)
        : new Date();
    this.draftId.set(event?.id ?? '');
    this.draftTitle.set(event?.title ?? '');
    this.draftDescription.set(event?.description ?? '');
    this.draftTime.set(this.toLocalInput(value));
    this.draftType.set(event?.type ?? 'meeting');
    this.draftCalendar.set(event?.calendar ?? 'Work');
    this.draftDuration.set(event?.duration || '1 hour');
    this.draftLocation.set(event?.location ?? '');
    this.draftAttendees.set([...(event?.attendees ?? [])]);
    this.draftAllDay.set(event?.allDay ?? false);
    this.draftReminder.set(event?.reminder ?? true);
    this.newAttendee.set('');
    this.editorOpen.set(true);
  }
  addAttendee(event?: Event): void {
    event?.preventDefault();
    const value = this.newAttendee().trim();
    if (value && !this.draftAttendees().includes(value))
      this.draftAttendees.update((items) => [...items, value]);
    this.newAttendee.set('');
  }
  removeAttendee(attendee: string): void {
    this.draftAttendees.update((items) => items.filter((item) => item !== attendee));
  }
  async save(submit: Event): Promise<void> {
    submit.preventDefault();
    if (!this.validDraft()) return;
    const saved = await this.store.saveEvent({
      id: this.draftId(),
      title: this.draftTitle().trim(),
      description: this.draftDescription(),
      startsAt: new Date(this.draftTime()).toISOString(),
      type: this.draftType(),
      calendar: this.draftCalendar(),
      duration: this.draftAllDay() ? 'All day' : this.draftDuration(),
      location: this.draftLocation(),
      attendees: this.draftAttendees(),
      allDay: this.draftAllDay(),
      reminder: this.draftReminder(),
    });
    if (saved) this.editorOpen.set(false);
  }
  async remove(): Promise<void> {
    if (
      this.draftId() &&
      confirm('Delete this event?') &&
      (await this.store.deleteEvent(this.draftId()))
    )
      this.editorOpen.set(false);
  }
  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private toLocalInput(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
