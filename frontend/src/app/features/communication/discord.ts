import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';

interface DiscordMessage {
  id: number;
  name: string;
  text: string;
  time: Date;
  mine?: boolean;
}

@Component({
  selector: 'app-discord',
  imports: [DatePipe],
  template: `
    <section class="discord-app panel">
      <aside class="discord-servers">
        <span class="discord-home">♯</span>
        @for (server of ['S', 'A', 'D', 'C']; track server) {
          <button type="button">{{ server }}</button>
        }
        <button type="button">＋</button>
      </aside>
      <aside class="discord-channels">
        <header><strong>Spartan Community</strong><span>⌄</span></header>
        <strong class="discord-section-title">⌄ INFORMATION</strong
        ><button type="button"># welcome</button><button type="button"># announcements</button
        ><strong class="discord-section-title">⌄ COMMUNITY</strong>
        @for (channel of channels; track channel) {
          <button
            type="button"
            [class.active]="activeChannel() === channel"
            (click)="activeChannel.set(channel)"
          >
            # {{ channel }}
          </button>
        }
        <strong class="discord-section-title">⌄ VOICE CHANNELS</strong
        ><button type="button">◉ Lounge</button>
        <footer>
          <span class="avatar">NP</span><span><b>Nyein</b><small>Online</small></span
          ><button type="button" aria-label="Mute">♩</button
          ><button type="button" aria-label="Settings">⚙</button>
        </footer>
      </aside>
      <div class="discord-main">
        <header>
          <strong># {{ activeChannel() }}</strong
          ><span>Product design and UI engineering discussions</span>
          <div>♙ 1,248&nbsp;&nbsp;⌕</div>
        </header>
        <div class="discord-messages">
          <div class="channel-welcome">
            <span>#</span>
            <h1>Welcome to #{{ activeChannel() }}!</h1>
            <p>This is the start of the #{{ activeChannel() }} channel.</p>
          </div>
          @for (message of messages(); track message.id) {
            <article>
              <span class="avatar large">{{ initials(message.name) }}</span>
              <div>
                <strong>{{ message.name }}</strong
                ><time>Today at {{ message.time | date: 'HH:mm' }}</time>
                <p>{{ message.text }}</p>
              </div>
            </article>
          }
        </div>
        <footer>
          <button type="button">＋</button
          ><input
            #messageInput
            [attr.aria-label]="'Message ' + activeChannel()"
            [placeholder]="'Message #' + activeChannel()"
            (keydown.enter)="send($event, messageInput)"
          /><span>☺ GIF</span>
        </footer>
      </div>
      <aside class="discord-members">
        <strong class="discord-section-title">ONLINE — 4</strong>
        @for (member of ['Nyein Phyo', 'Aiko Kimura', 'Marco Rossi', 'Sara Diallo']; track member) {
          <div>
            <span class="presence-wrap"
              ><span class="avatar">{{ initials(member) }}</span
              ><i data-status="online"></i></span
            ><span
              ><strong>{{ member }}</strong
              ><small>{{
                member === 'Nyein Phyo' ? 'Building Spartan Admin' : 'Online'
              }}</small></span
            >
          </div>
        }
        <strong class="discord-section-title">OFFLINE — 3</strong>
        @for (member of ['Liam Chen', 'Maya Patel', 'Noah Brown']; track member) {
          <div class="offline">
            <span class="avatar">{{ initials(member) }}</span
            ><span
              ><strong>{{ member }}</strong
              ><small>Offline</small></span
            >
          </div>
        }
      </aside>
    </section>
  `,
})
export class DiscordPage {
  readonly channels = ['general', 'design', 'development', 'showcase'];
  readonly activeChannel = signal('general');
  readonly messages = signal<DiscordMessage[]>([
    {
      id: 1,
      name: 'Aiko Kimura',
      text: 'Welcome everyone! The new dashboard preview is ready for review.',
      time: new Date(Date.now() - 5400000),
    },
    {
      id: 2,
      name: 'Marco Rossi',
      text: 'The Angular signal stores made the interaction model really clean.',
      time: new Date(Date.now() - 3900000),
    },
    {
      id: 3,
      name: 'Sara Diallo',
      text: 'I also finished the keyboard navigation audit. Looking solid!',
      time: new Date(Date.now() - 1800000),
    },
  ]);
  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
  }
  send(event: Event, input: HTMLInputElement): void {
    const key = event as KeyboardEvent;
    const text = input.value.trim();
    if (key.key === 'Enter' && text) {
      this.messages.update((items) => [
        ...items,
        { id: Date.now(), name: 'Nyein Phyo', text, time: new Date(), mine: true },
      ]);
      input.value = '';
    }
  }
}
