import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { ThemeStore } from '../../core/theme.store';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, HlmButton],
  template: `
    <div class="landing-shell">
      <nav class="landing-nav">
        <a routerLink="/" class="brand"
          ><span class="brand-mark">S</span><span>Spartan Admin</span></a
        >
        <div class="landing-links">
          <a href="#features">Features</a><a routerLink="/components">Components</a
          ><a href="#pages">Pages</a><a href="#workflow">Get started</a>
        </div>
        <div>
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Toggle theme"
            (click)="theme.toggle()"
          >
            {{ theme.dark() ? '☀' : '◐' }}</button
          ><a hlmBtn variant="outline" routerLink="/sign-in">Sign in</a>
        </div>
      </nav>
      <main>
        <section class="hero-section">
          <div class="hero-glow"></div>
          <span class="eyebrow">Angular 22 · Spartan UI · Go 1.27</span>
          <h1>The admin dashboard<br /><span>you actually ship.</span></h1>
          <p>
            A production-minded Angular admin with accessible Spartan primitives, signal-native
            state, real API-backed workflows, and a fast Go backend.
          </p>
          <div class="hero-actions">
            <a hlmBtn size="lg" routerLink="/sign-in">Open dashboard <span>→</span></a
            ><button hlmBtn size="lg" variant="outline" type="button" (click)="copyCommand()">
              {{ copied() ? 'Copied!' : 'pnpm start' }} <span>⌘</span>
            </button>
          </div>
          <div class="trust-row">
            <span>✓ MIT licensed</span><span>✓ Angular signals</span
            ><span>✓ 25+ working pages</span>
          </div>
          <div class="preview-window">
            <div class="preview-bar"><i></i><i></i><i></i><span>app.local/dashboard</span></div>
            <div class="mock-app">
              <aside>
                <b><span class="brand-mark">S</span> Spartan</b>
                @for (
                  item of ['Overview', 'Analytics', 'Customers', 'Transactions', 'Settings'];
                  track item
                ) {
                  <span [class.mock-active]="item === 'Overview'">{{ item }}</span>
                }
              </aside>
              <article>
                <header><small>Dashboard / Overview</small><span>⌕ Search</span></header>
                <div class="mock-title">
                  <div>
                    <strong class="mock-heading">Welcome back, Nyein</strong>
                    <p>Here’s what’s happening with your business.</p>
                  </div>
                  <button>Download report</button>
                </div>
                <div class="mock-metrics">
                  @for (metric of metrics; track metric.label) {
                    <div>
                      <small>{{ metric.label }}</small
                      ><strong>{{ metric.value }}</strong
                      ><em>{{ metric.delta }}</em>
                    </div>
                  }
                </div>
                <div class="mock-chart">
                  <div><small>Total revenue</small><strong>$45,231.89</strong></div>
                  <svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="Revenue trend">
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="var(--brand)" stop-opacity=".35" />
                        <stop offset="1" stop-color="var(--brand)" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,125 C70,120 60,80 130,95 S210,110 260,65 S350,90 405,45 S490,70 600,15 L600,150 L0,150Z"
                      fill="url(#heroGradient)"
                    />
                    <path
                      d="M0,125 C70,120 60,80 130,95 S210,110 260,65 S350,90 405,45 S490,70 600,15"
                      fill="none"
                      stroke="var(--brand)"
                      stroke-width="3"
                    />
                  </svg>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section class="logo-strip">
          <p>Built with the modern Angular ecosystem</p>
          <div>
            <span>ANGULAR</span><span>SPARTAN</span><span>TAILWIND</span><span>GO</span
            ><span>TYPE·SCRIPT</span>
          </div>
        </section>
        <section id="features" class="landing-section">
          <span class="eyebrow">Everything included</span>
          <h2>Start from a real product,<br />not an empty template.</h2>
          <p class="section-lead">
            Every page is responsive, accessible, dark-mode ready, and connected to the API.
          </p>
          <div class="feature-grid">
            @for (feature of features; track feature.title) {
              <article>
                <span class="feature-icon">{{ feature.icon }}</span>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.text }}</p>
                <a routerLink="/sign-in">Explore feature →</a>
              </article>
            }
          </div>
        </section>
        <section id="pages" class="landing-section tinted">
          <div class="section-split">
            <div>
              <span class="eyebrow">25+ pages</span>
              <h2>All the screens your team expects.</h2>
              <p class="section-lead">
                Analytics, communication, planning, billing, account management, and system states.
              </p>
            </div>
            <div class="page-list">
              @for (group of pageGroups; track group.title) {
                <article>
                  <h3>{{ group.title }}</h3>
                  @for (page of group.pages; track page) {
                    <span><i>✓</i>{{ page }}</span>
                  }
                </article>
              }
            </div>
          </div>
        </section>
        <section id="workflow" class="landing-section">
          <span class="eyebrow">Three steps</span>
          <h2>From clone to custom product.</h2>
          <div class="workflow-grid">
            @for (step of workflow; track step.number) {
              <article>
                <b>{{ step.number }}</b>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
                <code>{{ step.command }}</code>
              </article>
            }
          </div>
        </section>
        <section class="cta-panel">
          <span class="eyebrow">Ready when you are</span>
          <h2>Build the back office your product deserves.</h2>
          <p>Explore the complete demo with the seeded administrator account.</p>
          <a hlmBtn size="lg" routerLink="/sign-in">Open live dashboard →</a>
        </section>
      </main>
      <footer class="landing-footer">
        <a routerLink="/" class="brand"><span class="brand-mark">S</span>Spartan Admin</a
        ><span>Angular + Spartan UI + Go</span><span>Built for teams who ship.</span>
      </footer>
    </div>
  `,
})
export class LandingPage {
  readonly theme = inject(ThemeStore);
  readonly copied = signal(false);
  readonly metrics = [
    { label: 'Total revenue', value: '$45,231', delta: '+20.1%' },
    { label: 'Subscriptions', value: '2,350', delta: '+18.2%' },
    { label: 'Active now', value: '573', delta: '+12.5%' },
    { label: 'Churn rate', value: '1.2%', delta: '-0.4%' },
  ];
  readonly features = [
    {
      icon: '▤',
      title: 'Data tables that work',
      text: 'Sorting, filtering, selection, pagination, mutations, and CSV export with state that stays predictable.',
    },
    {
      icon: '⌾',
      title: 'Auth, wired end to end',
      text: 'Cookie sessions, guarded routes, sign in, sign up, password recovery, and secure password derivation.',
    },
    {
      icon: '✦',
      title: 'Assistant workflows',
      text: 'A polished AI chat interface with model selection, suggestions, loading states, and API responses.',
    },
    {
      icon: '⌁',
      title: 'Charts and reporting',
      text: 'Responsive revenue, sales, conversion, gateway, and product analytics with theme-aware visuals.',
    },
    {
      icon: '$',
      title: 'Billing screens',
      text: 'Payment metrics, transaction intelligence, gateway status, and three complete pricing layouts.',
    },
    {
      icon: '□',
      title: 'Boards and calendars',
      text: 'Drag-and-drop kanban and a full monthly calendar with event creation and mutations.',
    },
  ];
  readonly pageGroups = [
    {
      title: 'Core',
      pages: ['Analytics dashboard', 'Business dashboard', 'Users', 'Tasks', 'Kanban'],
    },
    { title: 'Communication', pages: ['Mail', 'Chats', 'AI chat', 'Calendar', 'Discord'] },
    {
      title: 'Account & system',
      pages: ['Settings', 'Payment center', 'Auth flows', 'Pricing', 'Error states'],
    },
  ];
  readonly workflow = [
    {
      number: '01',
      title: 'Install',
      text: 'Install the frontend packages and use the included Spartan primitives.',
      command: 'pnpm install',
    },
    {
      number: '02',
      title: 'Start the API',
      text: 'Launch the Go service with seeded data and secure sessions.',
      command: 'go run ./cmd/server',
    },
    {
      number: '03',
      title: 'Make it yours',
      text: 'Tune tokens, features, models, and persistence for your product.',
      command: 'pnpm start',
    },
  ];
  async copyCommand(): Promise<void> {
    await navigator.clipboard?.writeText('pnpm start');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
