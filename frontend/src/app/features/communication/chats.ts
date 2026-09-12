import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AdminStore } from '../../core/admin.store';

@Component({
  selector: 'app-chats',
  imports: [DatePipe, HlmButton],
  template: `
    <section class="page-heading compact-heading">
      <div>
        <h1>Chats</h1>
        <p>Keep in touch with your team.</p>
      </div>
      <button hlmBtn type="button" (click)="flash('Choose a teammate from the conversation list')">
        ＋ New chat
      </button>
    </section>
    <section
      class="chat-app panel"
      [class.mobile-thread-open]="mobileThreadOpen()"
      [class.details-hidden]="!detailsOpen()"
    >
      <aside class="conversation-list">
        <header>
          <div>
            <h2>Messages</h2>
            <button
              type="button"
              aria-label="New conversation"
              (click)="flash('Choose a teammate from the conversation list')"
            >
              ✎
            </button>
          </div>
          <div class="mail-search">
            <span>⌕</span
            ><input
              #searchInput
              aria-label="Search conversations"
              placeholder="Search conversations..."
              [value]="query()"
              (input)="query.set(searchInput.value)"
            />
          </div>
        </header>
        <div>
          @for (chat of filtered(); track chat.id) {
            <button
              type="button"
              [class.active]="selectedId() === chat.id"
              (click)="selectChat(chat.id)"
            >
              <span class="presence-wrap"
                ><span class="avatar large">{{ initials(chat.name) }}</span
                ><i [attr.data-status]="chat.status"></i></span
              ><span
                ><strong
                  >{{ chat.name }}
                  @if (isMuted(chat.id)) {
                    <i class="muted-mark" aria-label="Muted">🔕</i>
                  }</strong
                ><small>{{ lastMessage(chat) }}</small></span
              ><time>{{ lastTime(chat) | date: 'HH:mm' }}</time>
              @if (chat.unread) {
                <b>{{ chat.unread }}</b>
              }
            </button>
          } @empty {
            <p class="empty-state">No conversations found.</p>
          }
        </div>
      </aside>
      <article class="chat-thread">
        @if (selected(); as chat) {
          <header>
            <div class="user-cell">
              <button
                class="mobile-chat-back"
                type="button"
                aria-label="Back to conversations"
                (click)="mobileThreadOpen.set(false)"
              >
                ←</button
              ><span class="presence-wrap"
                ><span class="avatar large">{{ initials(chat.name) }}</span
                ><i [attr.data-status]="chat.status"></i></span
              ><span
                ><strong
                  >{{ chat.name }}
                  @if (isMuted(chat.id)) {
                    <i class="muted-mark" aria-label="Muted">🔕</i>
                  }</strong
                ><small>{{ chat.status }}</small></span
              >
            </div>
            <div>
              <button
                type="button"
                aria-label="Start video call"
                (click)="flash('Video calling is ready for a communications provider')"
              >
                ◫</button
              ><button
                type="button"
                aria-label="Start audio call"
                (click)="flash('Audio calling is ready for a communications provider')"
              >
                ⌕</button
              ><button
                type="button"
                aria-label="Conversation details"
                [attr.aria-pressed]="detailsOpen()"
                (click)="detailsOpen.update((value) => !value)"
              >
                ⓘ
              </button>
            </div>
          </header>
          <div class="message-thread">
            <div class="date-divider"><span>Today</span></div>
            @for (message of chat.messages; track message.id) {
              <div class="message" [class.mine]="message.mine">
                @if (!message.mine) {
                  <span class="avatar">{{ initials(message.sender) }}</span>
                }
                <div>
                  <p>{{ message.text }}</p>
                  <time>{{ message.createdAt | date: 'HH:mm' }}</time>
                </div>
              </div>
            }
          </div>
          <footer>
            <button
              type="button"
              aria-label="Attach file"
              (click)="flash('Choose a file after connecting object storage')"
            >
              ＋</button
            ><textarea
              #messageInput
              aria-label="Message"
              placeholder="Type a message..."
              (keydown.enter)="sendOnEnter($event, messageInput)"
            ></textarea
            ><button
              hlmBtn
              size="icon"
              type="button"
              aria-label="Send message"
              (click)="send(messageInput)"
            >
              ↑
            </button>
          </footer>
        } @else {
          <div class="empty-detail">
            <span>◌</span>
            <h2>Select a conversation</h2>
          </div>
        }
      </article>
      <aside class="chat-details">
        @if (selected(); as chat) {
          <span class="avatar profile-avatar">{{ initials(chat.name) }}</span>
          <h2>{{ chat.name }}</h2>
          <p><i [attr.data-status]="chat.status"></i>{{ chat.status }}</p>
          <div>
            <button type="button" (click)="flash('4 shared items')"><span>◫</span>Media</button
            ><button
              type="button"
              (click)="flash('Use the conversation search to find a teammate')"
            >
              <span>⌕</span>Search</button
            ><button
              type="button"
              [attr.aria-pressed]="isMuted(chat.id)"
              (click)="toggleMute(chat.id)"
            >
              <span>🔕</span>{{ isMuted(chat.id) ? 'Unmute' : 'Mute' }}
            </button>
          </div>
          <section>
            <h3>Shared media</h3>
            <div class="media-grid"><i></i><i></i><i></i><i></i></div>
          </section>
          <section>
            <h3>Options</h3>
            <button type="button" (click)="flash(chat.name + ' profile opened')">
              View profile <span>›</span></button
            ><button
              type="button"
              (click)="flash('History retention is managed by your administrator')"
            >
              Clear history <span>›</span></button
            ><button
              type="button"
              class="danger"
              (click)="flash('Blocking requires administrator confirmation')"
            >
              Block user <span>›</span>
            </button>
          </section>
        }
      </aside>
    </section>
    @if (notice()) {
      <div class="toast" role="status">✓ {{ notice() }}</div>
    }
  `,
})
export class ChatsPage {
  readonly store = inject(AdminStore);
  readonly query = signal('');
  readonly mobileThreadOpen = signal(false);
  readonly detailsOpen = signal(true);
  readonly notice = signal('');
  readonly mutedIds = signal(new Set<string>());
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.store.conversations().filter((c) => c.name.toLowerCase().includes(q));
  });
  readonly selectedId = linkedSignal(() => this.filtered()[0]?.id ?? '');
  readonly selected = computed(() =>
    this.store.conversations().find((c) => c.id === this.selectedId()),
  );
  constructor() {
    void this.store.loadChats();
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
  }
  lastMessage(chat: { messages: { text: string; createdAt: string }[] }): string {
    return chat.messages.at(-1)?.text ?? 'No messages yet';
  }
  lastTime(chat: { messages: { createdAt: string }[] }): string {
    return chat.messages.at(-1)?.createdAt ?? '';
  }
  selectChat(id: string): void {
    this.selectedId.set(id);
    this.mobileThreadOpen.set(true);
    this.store.markConversationRead(id);
  }
  isMuted(id: string): boolean {
    return this.mutedIds().has(id);
  }
  toggleMute(id: string): void {
    this.mutedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.flash(this.isMuted(id) ? 'Conversation muted' : 'Conversation unmuted');
  }
  async send(input: HTMLTextAreaElement): Promise<void> {
    const text = input.value.trim();
    if (!text || !this.selectedId()) return;
    if (await this.store.addMessage(this.selectedId(), text)) input.value = '';
  }
  async sendOnEnter(event: Event, input: HTMLTextAreaElement): Promise<void> {
    const key = event as KeyboardEvent;
    if (key.key === 'Enter' && !key.shiftKey) {
      key.preventDefault();
      await this.send(input);
    }
  }
  flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2500);
  }
}
