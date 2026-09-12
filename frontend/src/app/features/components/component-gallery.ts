import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { ThemeStore } from '../../core/theme.store';

@Component({
  selector: 'app-component-gallery',
  imports: [
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmSeparator,
    HlmSwitch,
    HlmTextarea,
    ...HlmAvatarImports,
    ...HlmCardImports,
    ...HlmProgressImports,
    ...HlmTabsImports,
  ],
  template: `
    <div class="gallery-shell">
      <header class="gallery-header">
        <a routerLink="/" class="brand"
          ><span class="brand-mark">S</span><span>Spartan Admin</span></a
        >
        <nav aria-label="Gallery navigation">
          <a href="#buttons">Buttons</a><a href="#forms">Forms</a
          ><a href="#composition">Composition</a>
        </nav>
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
          ><a hlmBtn variant="outline" routerLink="/dashboard">Open dashboard</a>
        </div>
      </header>

      <main class="gallery-main">
        <section class="gallery-hero">
          <div>
            <span hlmBadge variant="secondary">Prerendered Angular route</span>
            <h1>Spartan component gallery</h1>
            <p>
              Accessible Brain behavior, application-owned Helm styling, and Angular signal state in
              one interactive reference page.
            </p>
          </div>
          <dl>
            <div>
              <dt>Angular</dt>
              <dd>22</dd>
            </div>
            <div>
              <dt>Spartan</dt>
              <dd>1.4</dd>
            </div>
            <div>
              <dt>Primitives</dt>
              <dd>12</dd>
            </div>
          </dl>
        </section>

        <section id="buttons" class="gallery-section" aria-labelledby="buttons-title">
          <div class="gallery-section-heading">
            <div>
              <span>01</span>
              <h2 id="buttons-title">Actions and status</h2>
            </div>
            <p>Variants share focus, disabled, hover, and pressed behavior from Spartan Brain.</p>
          </div>
          <div class="gallery-grid">
            <article hlmCard>
              <header hlmCardHeader>
                <h3 hlmCardTitle>Button variants</h3>
                <p hlmCardDescription>Semantic intent without one-off button CSS.</p>
              </header>
              <div hlmCardContent class="gallery-row">
                <button hlmBtn type="button" (click)="increment()">Primary</button
                ><button hlmBtn variant="secondary" type="button">Secondary</button
                ><button hlmBtn variant="outline" type="button">Outline</button
                ><button hlmBtn variant="ghost" type="button">Ghost</button
                ><button hlmBtn variant="destructive" type="button">Delete</button
                ><button hlmBtn variant="link" type="button">Learn more</button
                ><button hlmBtn type="button" disabled>Disabled</button>
              </div>
              <footer hlmCardFooter>
                <span role="status"
                  >Signal counter: <strong>{{ count() }}</strong></span
                ><button hlmBtn variant="ghost" size="sm" type="button" (click)="count.set(0)">
                  Reset
                </button>
              </footer>
            </article>

            <article hlmCard>
              <header hlmCardHeader>
                <h3 hlmCardTitle>Badges</h3>
                <p hlmCardDescription>Compact labels for statuses and metadata.</p>
              </header>
              <div hlmCardContent class="gallery-row">
                <span hlmBadge>Default</span><span hlmBadge variant="secondary">In review</span
                ><span hlmBadge variant="outline">Draft</span
                ><span hlmBadge variant="destructive">Blocked</span
                ><span hlmBadge variant="ghost">Archived</span
                ><a hlmBadge variant="link" href="#forms">Interactive link</a>
              </div>
              <footer hlmCardFooter>
                <small>Each variant inherits the active theme and accent token.</small>
              </footer>
            </article>
          </div>
        </section>

        <div hlmSeparator decorative="true"></div>

        <section id="forms" class="gallery-section" aria-labelledby="forms-title">
          <div class="gallery-section-heading">
            <div>
              <span>02</span>
              <h2 id="forms-title">Form controls</h2>
            </div>
            <p>Native labels and keyboard behavior wrap reusable Spartan controls.</p>
          </div>
          <div class="gallery-grid">
            <article hlmCard>
              <header hlmCardHeader>
                <h3 hlmCardTitle>Inputs</h3>
                <p hlmCardDescription>Consistent focus and validation-ready states.</p>
              </header>
              <div hlmCardContent class="gallery-form">
                <label for="gallery-email">Work email</label
                ><input
                  hlmInput
                  id="gallery-email"
                  type="email"
                  placeholder="developer@example.com"
                /><label for="gallery-message">Project note</label
                ><textarea
                  hlmTextarea
                  id="gallery-message"
                  placeholder="What are you building?"
                ></textarea
                ><label for="gallery-disabled">Disabled field</label
                ><input hlmInput id="gallery-disabled" value="Managed by your workspace" disabled />
              </div>
            </article>

            <article hlmCard>
              <header hlmCardHeader>
                <h3 hlmCardTitle>Selection controls</h3>
                <p hlmCardDescription>Controlled by writable signals with typed outputs.</p>
              </header>
              <div hlmCardContent class="gallery-options">
                <div class="gallery-option">
                  <hlm-checkbox
                    aria-label="Accept preview terms"
                    [checked]="terms()"
                    (checkedChange)="terms.set($event)"
                  /><span
                    ><strong>Accept preview terms</strong
                    ><small>Checked: {{ terms() ? 'yes' : 'no' }}</small></span
                  >
                </div>
                <div class="gallery-option">
                  <hlm-switch
                    aria-label="Enable activity alerts"
                    [checked]="alerts()"
                    (checkedChange)="alerts.set($event)"
                  /><span
                    ><strong>Activity alerts</strong
                    ><small>{{
                      alerts() ? 'Notifications enabled' : 'Notifications paused'
                    }}</small></span
                  >
                </div>
                <div class="gallery-option">
                  <hlm-switch aria-label="Disabled example" disabled /><span
                    ><strong>Managed setting</strong
                    ><small>Disabled by an administrator</small></span
                  >
                </div>
              </div>
            </article>
          </div>
        </section>

        <div hlmSeparator decorative="true"></div>

        <section id="composition" class="gallery-section" aria-labelledby="composition-title">
          <div class="gallery-section-heading">
            <div>
              <span>03</span>
              <h2 id="composition-title">Composition</h2>
            </div>
            <p>Higher-level patterns composed from small Helm directives.</p>
          </div>
          <div class="gallery-grid">
            <article hlmCard>
              <header hlmCardHeader>
                <div>
                  <h3 hlmCardTitle>Release readiness</h3>
                  <p hlmCardDescription>Card, avatar, badge, progress, and actions.</p>
                </div>
                <span hlmBadge hlmCardAction variant="secondary">On track</span>
              </header>
              <div hlmCardContent class="gallery-release">
                <div class="gallery-people">
                  <hlm-avatar size="lg"><span hlmAvatarFallback>AK</span></hlm-avatar
                  ><hlm-avatar size="lg"><span hlmAvatarFallback>MR</span></hlm-avatar
                  ><hlm-avatar size="lg"><span hlmAvatarFallback>SD</span></hlm-avatar
                  ><span>3 reviewers</span>
                </div>
                <label for="release-progress"
                  >Release progress <strong>{{ progress() }}%</strong></label
                >
                <div
                  id="release-progress"
                  hlmProgress
                  [value]="progress()"
                  aria-label="Release progress"
                >
                  <div hlmProgressIndicator></div>
                </div>
                <input
                  class="gallery-range"
                  type="range"
                  min="0"
                  max="100"
                  [value]="progress()"
                  (input)="setProgress($event)"
                  aria-label="Change release progress"
                />
              </div>
              <footer hlmCardFooter>
                <button hlmBtn variant="outline" type="button" (click)="progress.set(100)">
                  Mark complete
                </button>
              </footer>
            </article>

            <article hlmCard>
              <header hlmCardHeader>
                <h3 hlmCardTitle>Tabs</h3>
                <p hlmCardDescription>Keyboard-aware tab behavior from Spartan Brain.</p>
              </header>
              <div hlmCardContent>
                <div hlmTabs tab="preview">
                  <div hlmTabsList aria-label="Component information">
                    <button hlmTabsTrigger="preview" type="button">Preview</button
                    ><button hlmTabsTrigger="anatomy" type="button">Anatomy</button
                    ><button hlmTabsTrigger="angular" type="button">Angular</button>
                  </div>
                  <div hlmTabsContent="preview" class="gallery-tab-panel">
                    <strong>Theme-aware by default</strong>
                    <p>
                      Change the global mode or accent and every primitive follows the same token
                      system.
                    </p>
                  </div>
                  <div hlmTabsContent="anatomy" class="gallery-tab-panel">
                    <strong>Brain + Helm</strong>
                    <p>
                      Brain owns accessible behavior. Helm directives own styling and remain local
                      to the application.
                    </p>
                  </div>
                  <div hlmTabsContent="angular" class="gallery-tab-panel">
                    <strong>Signals + native control flow</strong>
                    <p>
                      The examples use signal inputs, typed outputs, and Angular's built-in template
                      syntax.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="gallery-architecture" aria-labelledby="architecture-title">
          <span hlmBadge variant="outline">Architecture</span>
          <h2 id="architecture-title">Own the look. Reuse the behavior.</h2>
          <p>
            The gallery imports locally owned Helm components through path aliases while Spartan
            Brain supplies the accessible interaction model.
          </p>
          <div>
            @for (item of primitives; track item) {
              <code>{{ item }}</code>
            }
          </div>
        </section>
      </main>
    </div>
  `,
})
export class ComponentGalleryPage {
  readonly theme = inject(ThemeStore);
  readonly count = signal(0);
  readonly terms = signal(false);
  readonly alerts = signal(true);
  readonly progress = signal(68);
  readonly primitives = [
    'button',
    'badge',
    'card',
    'input',
    'textarea',
    'checkbox',
    'switch',
    'tabs',
    'progress',
    'avatar',
    'separator',
    'utils',
  ];

  increment(): void {
    this.count.update((value) => value + 1);
  }
  setProgress(event: Event): void {
    this.progress.set(Number((event.target as HTMLInputElement).value));
  }
}
