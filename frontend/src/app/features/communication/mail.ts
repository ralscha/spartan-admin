import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AdminStore } from '../../core/admin.store';
import { Mail } from '../../core/models';

type ResizePane = 'navigation' | 'messages';

@Component({
  selector: 'app-mail',
  imports: [DatePipe, HlmButton],
  template: `
    <section class="page-heading compact-heading">
      <div>
        <h1>Mail</h1>
        <p>Read and manage messages across your accounts.</p>
      </div>
      <button hlmBtn type="button" (click)="composeOpen.set(true)">Compose</button>
    </section>

    <section
      class="mail-app panel"
      [class.mobile-detail-open]="mobileDetailOpen()"
      [class.nav-collapsed]="navCollapsed()"
      [style.--mail-nav-width]="navWidth() + 'px'"
      [style.--mail-list-width]="listWidth() + 'px'"
    >
      <aside class="mail-nav">
        <div class="mail-account-switcher">
          <span class="avatar">{{ initials(activeAccount().label) }}</span>
          <select
            #accountInput
            aria-label="Select account"
            [value]="activeAccount().email"
            (change)="switchAccount(accountInput.value)"
          >
            @for (account of accounts; track account.email) {
              <option [value]="account.email">{{ account.label }} - {{ account.email }}</option>
            }
          </select>
        </div>
        <button
          hlmBtn
          class="wide-button"
          type="button"
          aria-label="Compose"
          (click)="composeOpen.set(true)"
        >
          <span>Compose</span><b aria-hidden="true">&#8599;</b>
        </button>
        <nav aria-label="Mail folders">
          @for (item of folders; track item.name) {
            <button
              type="button"
              [attr.aria-label]="item.name"
              [class.active]="folder() === item.name"
              (click)="selectFolder(item.name)"
            >
              <span class="mail-nav-icon">{{ item.icon }}</span
              ><span>{{ item.name }}</span>
              @if (folderCount(item.name)) {
                <b>{{ folderCount(item.name) }}</b>
              }
            </button>
          }
        </nav>
        <h2>Labels</h2>
        @for (label of labels; track label.name) {
          <button
            type="button"
            [attr.aria-label]="'Filter by ' + label.name"
            (click)="selectLabel(label.name)"
          >
            <i [style.background]="label.color"></i><span>{{ label.name }}</span>
          </button>
        }
      </aside>

      <button
        class="mail-resize-handle"
        type="button"
        aria-label="Resize navigation panel"
        (pointerdown)="startResize('navigation', $event)"
      >
        <span></span>
      </button>

      <div class="mail-list">
        <header>
          <div class="mail-list-title">
            <h2>{{ folder() }}</h2>
            <div class="mail-tabs" role="group" aria-label="Message filter">
              <button type="button" [class.active]="filter() === 'all'" (click)="filter.set('all')">
                All mail</button
              ><button
                type="button"
                [class.active]="filter() === 'unread'"
                (click)="filter.set('unread')"
              >
                Unread
              </button>
            </div>
          </div>
          <div class="mail-search">
            <span>&#8981;</span
            ><input
              #searchInput
              aria-label="Search mail"
              placeholder="Search by name..."
              [value]="query()"
              (input)="query.set(searchInput.value)"
            />
          </div>
        </header>
        <div class="mail-items">
          @for (mail of filtered(); track mail.id) {
            <button
              type="button"
              [class.active]="selectedId() === mail.id"
              [class.unread]="!mail.read"
              (click)="selectMail(mail.id)"
            >
              <div>
                <span class="avatar">{{ initials(mail.name) }}</span
                ><strong>{{ mail.name }}</strong>
                @if (!mail.read) {
                  <i class="unread-dot" aria-label="Unread"></i>
                }
                <time>{{ mail.date | date: 'MMM d' }}</time>
              </div>
              <h2>{{ mail.subject }}</h2>
              <p>{{ mail.text }}</p>
              <footer>
                @for (label of mail.labels; track label) {
                  <span>{{ label }}</span>
                }
              </footer>
            </button>
          } @empty {
            <div class="empty-state">
              <span>0 messages</span>
              <p>No mail found in {{ folder() }}.</p>
            </div>
          }
        </div>
      </div>

      <button
        class="mail-resize-handle"
        type="button"
        aria-label="Resize message list"
        (pointerdown)="startResize('messages', $event)"
      >
        <span></span>
      </button>

      <article class="mail-display">
        @if (selected(); as mail) {
          <header>
            <button
              class="mobile-mail-back"
              type="button"
              aria-label="Back to messages"
              (click)="mobileDetailOpen.set(false)"
            >
              &#8592;
            </button>
            <div class="mail-toolbar" role="toolbar" aria-label="Message actions">
              <button
                type="button"
                aria-label="Archive"
                title="Archive"
                (click)="moveSelected('Archive')"
              >
                A
              </button>
              <button
                type="button"
                aria-label="Move to junk"
                title="Move to junk"
                (click)="moveSelected('Junk')"
              >
                !
              </button>
              <button
                type="button"
                aria-label="Move to trash"
                title="Move to trash"
                (click)="moveSelected('Trash')"
              >
                &#9003;
              </button>
              <span></span>
              <div class="mail-snooze">
                <button
                  type="button"
                  aria-label="Snooze"
                  title="Snooze"
                  [attr.aria-expanded]="snoozeOpen()"
                  (click)="snoozeOpen.update((value) => !value)"
                >
                  &#9716;
                </button>
                @if (snoozeOpen()) {
                  <div class="mail-snooze-menu">
                    <strong>Snooze until</strong
                    ><button type="button" (click)="snooze('Later today')">
                      Later today <small>4 hours</small></button
                    ><button type="button" (click)="snooze('Tomorrow')">
                      Tomorrow <small>08:00</small></button
                    ><button type="button" (click)="snooze('This weekend')">
                      This weekend <small>Sat</small></button
                    ><button type="button" (click)="snooze('Next week')">
                      Next week <small>Mon</small>
                    </button>
                  </div>
                }
              </div>
            </div>
            <div class="mail-toolbar mail-toolbar-right">
              <button type="button" aria-label="Reply" title="Reply" (click)="focusReply()">
                R
              </button>
              <button type="button" aria-label="Reply all" title="Reply all" (click)="focusReply()">
                RA
              </button>
              <button
                type="button"
                aria-label="Forward"
                title="Forward"
                (click)="composeForward(mail)"
              >
                F
              </button>
              <details class="mail-more-menu">
                <summary aria-label="More actions">...</summary>
                <div>
                  <button type="button" (click)="toggleRead()">
                    {{ mail.read ? 'Mark unread' : 'Mark read' }}</button
                  ><button type="button" (click)="moveSelected('Archive')">Archive</button
                  ><button type="button" (click)="moveSelected('Trash')">Move to trash</button>
                </div>
              </details>
            </div>
          </header>
          <div class="mail-subject">
            <div class="user-cell">
              <span class="avatar large">{{ initials(mail.name) }}</span
              ><span
                ><strong>{{ mail.name }}</strong
                ><small>{{ mail.subject }}</small
                ><small><b>Reply-To:</b> {{ mail.email }}</small></span
              >
            </div>
            <time>{{ mail.date | date: 'medium' }}</time>
          </div>
          <div class="mail-body">
            @for (paragraph of paragraphs(mail.text); track $index) {
              <p>{{ paragraph }}</p>
            }
          </div>
          <footer>
            <textarea
              id="mail-reply"
              #replyInput
              aria-label="Reply message"
              [placeholder]="'Reply ' + mail.name + '...'"
            ></textarea>
            <div class="mail-reply-actions">
              <label
                ><input
                  type="checkbox"
                  [checked]="muteThread()"
                  (change)="muteThread.update((value) => !value)"
                />
                Mute this thread</label
              ><button
                hlmBtn
                type="button"
                (click)="sendReply(mail, replyInput.value); replyInput.value = ''"
              >
                {{ replySent() ? 'Sent' : 'Send' }}
              </button>
            </div>
          </footer>
        } @else {
          <div class="empty-detail">
            <span>MAIL</span>
            <h2>No message selected</h2>
            <p>Choose a conversation from your inbox.</p>
          </div>
        }
      </article>
    </section>

    @if (composeOpen()) {
      <div class="compose-window">
        <header>
          <strong>{{ composeTitle() }}</strong
          ><button type="button" aria-label="Close compose" (click)="closeCompose()">
            &times;
          </button>
        </header>
        <label
          >To
          <input
            #toInput
            aria-label="Recipient"
            placeholder="name@example.com"
            [value]="composeTo()"
        /></label>
        <input
          #subjectInput
          aria-label="Subject"
          placeholder="Subject"
          [value]="composeSubject()"
        />
        <textarea
          #bodyInput
          aria-label="Message body"
          placeholder="Write your message..."
          [value]="composeBody()"
        ></textarea>
        <footer>
          <button
            hlmBtn
            type="button"
            (click)="sendCompose(toInput.value, subjectInput.value, bodyInput.value)"
          >
            Send</button
          ><button type="button" aria-label="Attach file">Attach</button>
        </footer>
      </div>
    }
    @if (notice()) {
      <div class="toast" role="status">&#10003; {{ notice() }}</div>
    }
  `,
})
export class MailPage {
  readonly store = inject(AdminStore);
  readonly folder = signal('Inbox');
  readonly filter = signal<'all' | 'unread'>('all');
  readonly query = signal('');
  readonly composeOpen = signal(false);
  readonly mobileDetailOpen = signal(false);
  readonly notice = signal('');
  readonly replySent = signal(false);
  readonly muteThread = signal(false);
  readonly snoozeOpen = signal(false);
  readonly navWidth = signal(180);
  readonly listWidth = signal(340);
  readonly currentAccount = signal('admin@example.com');
  readonly composeTitle = signal('New message');
  readonly composeTo = signal('');
  readonly composeSubject = signal('');
  readonly composeBody = signal('');
  readonly accounts = [
    { label: 'Nyein Phyo', email: 'admin@example.com' },
    { label: 'Product team', email: 'product@example.com' },
    { label: 'Support', email: 'support@example.com' },
  ];
  readonly folders = [
    { name: 'Inbox', icon: 'IN' },
    { name: 'Drafts', icon: 'DR' },
    { name: 'Sent', icon: 'SE' },
    { name: 'Junk', icon: 'JU' },
    { name: 'Trash', icon: 'TR' },
    { name: 'Archive', icon: 'AR' },
  ];
  readonly labels = [
    { name: 'work', color: '#3b82f6' },
    { name: 'personal', color: '#8b5cf6' },
    { name: 'important', color: '#ef4444' },
    { name: 'billing', color: '#f59e0b' },
  ];
  readonly activeAccount = computed(
    () =>
      this.accounts.find((account) => account.email === this.currentAccount()) ?? this.accounts[0],
  );
  readonly navCollapsed = computed(() => this.navWidth() < 90);
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.store
      .mails()
      .filter(
        (mail) =>
          mail.folder === this.folder() &&
          (this.filter() === 'all' || !mail.read) &&
          (!query ||
            `${mail.name} ${mail.email} ${mail.subject} ${mail.text} ${mail.labels.join(' ')}`
              .toLowerCase()
              .includes(query)),
      );
  });
  readonly selectedId = linkedSignal(() => this.filtered()[0]?.id ?? '');
  readonly selected = computed(() =>
    this.store.mails().find((mail) => mail.id === this.selectedId()),
  );

  constructor() {
    void this.store.loadMails();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  paragraphs(text: string): string[] {
    return text.split('\n').filter(Boolean);
  }
  folderCount(folder: string): number {
    return this.store.mails().filter((mail) => mail.folder === folder).length;
  }
  selectFolder(folder: string): void {
    this.folder.set(folder);
    this.query.set('');
    this.mobileDetailOpen.set(false);
  }
  selectLabel(label: string): void {
    this.folder.set('Inbox');
    this.query.set(label);
    this.mobileDetailOpen.set(false);
  }
  switchAccount(email: string): void {
    this.currentAccount.set(email);
    this.flash(`Switched to ${this.activeAccount().label}`);
  }
  async selectMail(id: string): Promise<void> {
    this.selectedId.set(id);
    this.mobileDetailOpen.set(true);
    this.replySent.set(false);
    this.snoozeOpen.set(false);
    const mail = this.store.mails().find((item) => item.id === id);
    if (mail && !mail.read) await this.store.markMail(id, true);
  }
  async toggleRead(): Promise<void> {
    const mail = this.selected();
    if (mail) await this.store.markMail(mail.id, !mail.read);
  }
  async moveSelected(folder: string): Promise<void> {
    const mail = this.selected();
    if (!mail) return;
    if (await this.store.moveMail(mail.id, folder)) {
      this.mobileDetailOpen.set(false);
      this.flash(`Message moved to ${folder}`);
    }
  }
  snooze(until: string): void {
    this.snoozeOpen.set(false);
    this.flash(`Message snoozed: ${until}`);
  }
  focusReply(): void {
    document.querySelector<HTMLTextAreaElement>('#mail-reply')?.focus();
  }
  composeForward(mail: Mail): void {
    this.composeTitle.set('Forward message');
    this.composeTo.set('');
    this.composeSubject.set(
      mail.subject.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`,
    );
    this.composeBody.set(
      `\n\n---------- Forwarded message ----------\nFrom: ${mail.name} <${mail.email}>\n\n${mail.text}`,
    );
    this.composeOpen.set(true);
  }
  closeCompose(): void {
    this.composeOpen.set(false);
    this.resetCompose();
  }
  async sendReply(mail: Mail, body: string): Promise<void> {
    if (!body.trim()) {
      this.flash('Write a reply first');
      return;
    }
    if (
      await this.store.sendMail(
        mail.email,
        mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
        body,
      )
    ) {
      this.replySent.set(true);
      this.flash('Reply sent');
    }
  }
  async sendCompose(to: string, subject: string, body: string): Promise<void> {
    if (!to.includes('@') || !subject.trim() || !body.trim()) {
      this.flash('Complete all message fields');
      return;
    }
    if (await this.store.sendMail(to, subject, body)) {
      this.composeOpen.set(false);
      this.resetCompose();
      this.folder.set('Sent');
      this.mobileDetailOpen.set(true);
      this.flash('Message sent');
    }
  }
  startResize(pane: ResizePane, event: PointerEvent): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = pane === 'navigation' ? this.navWidth() : this.listWidth();
    const move = (next: PointerEvent) => {
      const width = startWidth + next.clientX - startX;
      if (pane === 'navigation') this.navWidth.set(Math.max(72, Math.min(250, width)));
      else this.listWidth.set(Math.max(280, Math.min(520, width)));
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }
  private resetCompose(): void {
    this.composeTitle.set('New message');
    this.composeTo.set('');
    this.composeSubject.set('');
    this.composeBody.set('');
  }
  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2500);
  }
}
