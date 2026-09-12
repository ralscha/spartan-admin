import { Component, computed, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-help',
  imports: [HlmButton],
  template: `
    <section class="help-hero">
      <span>How can we help?</span>
      <h1>Advice and answers from the Spartan team</h1>
      <div>
        <span>⌕</span
        ><input
          #searchInput
          aria-label="Search help articles"
          placeholder="Search for articles..."
          [value]="query()"
          (input)="query.set(searchInput.value)"
        />
      </div>
      <p>
        Popular: <button type="button" (click)="query.set('account')">account</button
        ><button type="button" (click)="query.set('billing')">billing</button
        ><button type="button" (click)="query.set('theme')">theme</button>
      </p>
    </section>
    <div class="help-content">
      <section class="help-categories">
        <h2>Browse by category</h2>
        <div>
          @for (category of filteredCategories(); track category.title) {
            <article>
              <span>{{ category.icon }}</span>
              <div>
                <h3>{{ category.title }}</h3>
                <p>{{ category.text }}</p>
                <small>{{ category.articles }} articles</small>
              </div>
              <b>→</b>
            </article>
          } @empty {
            <p class="empty-state">No categories match “{{ query() }}”.</p>
          }
        </div>
      </section>
      <section class="popular-articles">
        <div>
          <h2>Popular articles</h2>
          <a href="#faq">View all</a>
        </div>
        @for (article of articles; track article.title) {
          <article>
            <span>{{ article.icon }}</span>
            <div>
              <h3>{{ article.title }}</h3>
              <p>{{ article.text }}</p>
            </div>
            <b>→</b>
          </article>
        }
      </section>
      <section id="faq" class="faq-section">
        <span class="eyebrow">FAQ</span>
        <h2>Frequently asked questions</h2>
        @for (faq of faqs; track faq.question; let i = $index) {
          <article [class.open]="openFaq() === i">
            <button
              type="button"
              [attr.aria-expanded]="openFaq() === i"
              (click)="openFaq.set(openFaq() === i ? -1 : i)"
            >
              <span>{{ faq.question }}</span
              ><b>{{ openFaq() === i ? '−' : '+' }}</b>
            </button>
            @if (openFaq() === i) {
              <p>{{ faq.answer }}</p>
            }
          </article>
        }
      </section>
      <section class="contact-panel">
        <span>◌</span>
        <div>
          <h2>Still need help?</h2>
          <p>Our support team usually replies in under two hours.</p>
        </div>
        <button hlmBtn type="button" (click)="contacted.set(true)">
          {{ contacted() ? 'Message sent' : 'Contact support' }}
        </button>
      </section>
    </div>
  `,
})
export class HelpPage {
  readonly query = signal('');
  readonly openFaq = signal(0);
  readonly contacted = signal(false);
  readonly categories = [
    {
      icon: '⚙',
      title: 'Getting started',
      text: 'Setup, navigation, and first steps.',
      articles: 8,
    },
    {
      icon: '♙',
      title: 'Account & profile',
      text: 'Manage your identity and workspace.',
      articles: 12,
    },
    {
      icon: '$',
      title: 'Plans & billing',
      text: 'Invoices, plans, and payment methods.',
      articles: 9,
    },
    {
      icon: '⌾',
      title: 'Security & privacy',
      text: 'Sessions, permissions, and data.',
      articles: 7,
    },
    {
      icon: '◫',
      title: 'Dashboard & reports',
      text: 'Metrics, filters, and exports.',
      articles: 14,
    },
    { icon: '✦', title: 'Customization', text: 'Themes, layouts, and preferences.', articles: 11 },
  ];
  readonly filteredCategories = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.categories.filter((c) => `${c.title} ${c.text}`.toLowerCase().includes(q))
      : this.categories;
  });
  readonly articles = [
    {
      icon: '1',
      title: 'Invite your team',
      text: 'Add members and choose the right workspace roles.',
    },
    {
      icon: '2',
      title: 'Configure notification preferences',
      text: 'Choose what reaches you and where.',
    },
    { icon: '3', title: 'Export a dashboard report', text: 'Download the data behind any table.' },
    {
      icon: '4',
      title: 'Use dark mode and themes',
      text: 'Make the interface feel like your product.',
    },
  ];
  readonly faqs = [
    {
      question: 'Can I use this dashboard in a commercial project?',
      answer: 'Yes. The project is MIT licensed and designed to be adapted to your own product.',
    },
    {
      question: 'How does authentication work?',
      answer:
        'The Go API stores HttpOnly sessions and hashes passwords with Argon2id. Protected Angular routes restore the session before activation.',
    },
    {
      question: 'Is the application signal-native?',
      answer:
        'Yes. Component state, domain stores, form values, loading states, theme preferences, and derived state are all Angular signals.',
    },
    {
      question: 'Can I replace the in-memory store?',
      answer:
        'Yes. Store operations sit behind a small domain API, so PostgreSQL or another durable database can be added without changing the frontend contract.',
    },
  ];
}
