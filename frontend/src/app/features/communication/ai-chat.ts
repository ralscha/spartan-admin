import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AdminStore } from '../../core/admin.store';

interface UiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-ai-chat',
  imports: [HlmButton],
  template: `
    <section class="ai-chat-page">
      <header>
        <div>
          <span class="ai-mark">✦</span
          ><span
            ><h1>AI assistant</h1>
            <p>Ask questions about your workspace and data.</p></span
          >
        </div>
        <select
          #modelInput
          aria-label="AI model"
          [value]="model()"
          (change)="model.set(modelInput.value)"
        >
          <option value="fast">Fast</option>
          <option value="balanced">Balanced</option>
          <option value="advanced">Advanced</option>
        </select>
      </header>
      <div class="ai-thread">
        @if (messages().length === 0) {
          <section class="ai-empty">
            <span class="ai-orb">✦</span>
            <h2>How can I help you today?</h2>
            <p>
              I can summarize revenue, draft release notes, find customer trends, or explain
              technical work.
            </p>
            <div>
              @for (suggestion of suggestions; track suggestion) {
                <button type="button" (click)="ask(suggestion)">
                  <span>↗</span>{{ suggestion }}
                </button>
              }
            </div>
          </section>
        } @else {
          @for (message of messages(); track message.id) {
            <article class="ai-message" [class.user]="message.role === 'user'">
              <span>{{ message.role === 'assistant' ? '✦' : 'NP' }}</span>
              <div>
                <strong>{{ message.role === 'assistant' ? 'Spartan AI' : 'You' }}</strong>
                @for (paragraph of paragraphs(message.text); track $index) {
                  <p>{{ paragraph }}</p>
                }
              </div>
            </article>
          }
          @if (pending()) {
            <article class="ai-message">
              <span>✦</span>
              <div>
                <strong>Spartan AI</strong>
                <p class="thinking"><i></i><i></i><i></i></p>
              </div>
            </article>
          }
        }
      </div>
      <footer class="ai-composer">
        <div>
          <textarea
            #promptInput
            aria-label="Message AI assistant"
            placeholder="Ask anything about your workspace..."
            (keydown.enter)="submitOnEnter($event, promptInput)"
          ></textarea
          ><button
            hlmBtn
            size="icon"
            type="button"
            aria-label="Send prompt"
            [disabled]="pending()"
            (click)="askFrom(promptInput)"
          >
            ↑
          </button>
        </div>
        <p>AI can make mistakes. Check important information.</p>
      </footer>
    </section>
  `,
})
export class AiChatPage {
  readonly store = inject(AdminStore);
  readonly model = signal('balanced');
  readonly pending = signal(false);
  readonly messages = signal<UiMessage[]>([]);
  readonly suggestions = [
    "Summarise this month's revenue",
    'Draft release notes for v2.4',
    'Which payments need attention?',
    'Create a launch checklist',
  ];
  private sequence = 0;
  paragraphs(text: string): string[] {
    return text.split('\n').filter(Boolean);
  }
  async askFrom(input: HTMLTextAreaElement): Promise<void> {
    const prompt = input.value.trim();
    if (!prompt) return;
    input.value = '';
    await this.ask(prompt);
  }
  async ask(prompt: string): Promise<void> {
    if (this.pending()) return;
    this.messages.update((items) => [
      ...items,
      { id: ++this.sequence, role: 'user', text: prompt },
    ]);
    this.pending.set(true);
    try {
      const reply = await this.store.askAi(prompt, this.model());
      if (reply)
        this.messages.update((items) => [
          ...items,
          { id: ++this.sequence, role: 'assistant', text: reply },
        ]);
    } finally {
      this.pending.set(false);
    }
  }
  async submitOnEnter(event: Event, input: HTMLTextAreaElement): Promise<void> {
    const key = event as KeyboardEvent;
    if (!key.shiftKey) {
      key.preventDefault();
      await this.askFrom(input);
    }
  }
}
