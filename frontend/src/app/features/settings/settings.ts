import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { AdminStore } from '../../core/admin.store';
import { Settings } from '../../core/models';
import { ThemeAccent, ThemeFont, ThemeMode, ThemeStore } from '../../core/theme.store';
import { AuthStore } from '../../core/auth.store';

@Component({
  selector: 'app-settings',
  imports: [RouterLink, RouterLinkActive, HlmButton, HlmInput, HlmTextarea],
  template: `
    <section class="page-heading">
      <div>
        <h1>Settings</h1>
        <p>Manage your account settings and workspace preferences.</p>
      </div>
    </section>
    <div class="settings-layout">
      <aside>
        <nav aria-label="Settings sections">
          @for (item of sections; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              ><span>{{ item.icon }}</span
              >{{ item.label }}</a
            >
          }
        </nav>
      </aside>
      <div class="settings-content">
        @if (store.loading() && !store.settings()) {
          <div class="settings-skeleton"></div>
        } @else {
          @switch (section()) {
            @case ('account') {
              <section class="settings-section">
                <header>
                  <h2>Account</h2>
                  <p>Update your account preferences and security.</p>
                </header>
                <form (submit)="save($event)">
                  <label for="account-name">Username</label
                  ><input
                    hlmInput
                    id="account-name"
                    #nameInput
                    [value]="name()"
                    (input)="name.set(nameInput.value)"
                  /><small>This is your public display name.</small
                  ><label for="language">Language</label
                  ><select
                    id="language"
                    #languageInput
                    [value]="language()"
                    (change)="language.set(languageInput.value)"
                  >
                    <option>English</option>
                    <option>German</option>
                    <option>French</option>
                    <option>Japanese</option></select
                  ><small>Language used throughout the dashboard.</small>
                  <div class="danger-zone">
                    <h3>Delete account</h3>
                    <p>Permanently remove your account and all associated data.</p>
                    <button
                      hlmBtn
                      variant="destructive"
                      type="button"
                      (click)="dangerNotice.set(true)"
                    >
                      Delete account
                    </button>
                    @if (dangerNotice()) {
                      <small role="alert"
                        >Account deletion requires administrator confirmation.</small
                      >
                    }
                  </div>
                  <button hlmBtn type="submit">Update account</button>
                </form>
              </section>
            }
            @case ('appearance') {
              <section class="settings-section">
                <header>
                  <h2>Appearance</h2>
                  <p>Customize how Spartan Admin looks on your device.</p>
                </header>
                <div class="appearance-controls">
                  <h3>Theme</h3>
                  <p>Select your preferred color mode.</p>
                  <div class="theme-cards">
                    @for (mode of modes; track mode.value) {
                      <button
                        type="button"
                        [class.active]="theme.mode() === mode.value"
                        (click)="theme.mode.set(mode.value)"
                      >
                        <span [attr.data-mode]="mode.value"><i></i><i></i><i></i></span
                        ><b>{{ mode.label }}</b>
                      </button>
                    }
                  </div>
                  <h3>Font</h3>
                  <p>Use the self-hosted Inter family or your system interface font.</p>
                  <div class="font-picker">
                    @for (font of fonts; track font.value) {
                      <button
                        type="button"
                        [class.active]="theme.font() === font.value"
                        (click)="theme.font.set(font.value)"
                      >
                        <b [style.font-family]="font.family">Aa</b><span>{{ font.label }}</span>
                      </button>
                    }
                  </div>
                  <h3>Accent color</h3>
                  <p>Choose the primary color used for active controls.</p>
                  <div class="accent-picker">
                    @for (color of accents; track color.name) {
                      <button
                        type="button"
                        [class.active]="theme.accent() === color.name"
                        [style.--swatch]="color.value"
                        [attr.aria-label]="color.name"
                        (click)="theme.accent.set(color.name)"
                      >
                        <i></i><span>{{ color.name }}</span>
                      </button>
                    }
                  </div>
                  <h3>Corner radius</h3>
                  <p>Adjust the shape of cards and controls.</p>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    aria-label="Corner radius"
                    [value]="theme.radius()"
                    (input)="setRadius($event)"
                  />
                  <div class="radius-preview">
                    <span>Preview card</span><button hlmBtn type="button">Action</button>
                  </div>
                </div>
              </section>
            }
            @case ('notifications') {
              <section class="settings-section">
                <header>
                  <h2>Notifications</h2>
                  <p>Choose what you are notified about and where.</p>
                </header>
                <form (submit)="save($event)" class="notification-form">
                  <h3>Email notifications</h3>
                  @for (option of emailOptions; track option.key) {
                    <div class="toggle-row">
                      <span
                        ><b>{{ option.title }}</b
                        ><small>{{ option.text }}</small></span
                      ><button
                        type="button"
                        role="switch"
                        [attr.aria-label]="option.title"
                        [attr.aria-checked]="setting(option.key)"
                        [class.checked]="setting(option.key)"
                        (click)="toggleSetting(option.key)"
                      >
                        <i></i>
                      </button>
                    </div>
                  }
                  <h3>Push notifications</h3>
                  @for (option of pushOptions; track option.key) {
                    <div class="toggle-row">
                      <span
                        ><b>{{ option.title }}</b
                        ><small>{{ option.text }}</small></span
                      ><button
                        type="button"
                        role="switch"
                        [attr.aria-label]="option.title"
                        [attr.aria-checked]="setting(option.key)"
                        [class.checked]="setting(option.key)"
                        (click)="toggleSetting(option.key)"
                      >
                        <i></i>
                      </button>
                    </div>
                  }
                  <button hlmBtn type="submit">Save preferences</button>
                </form>
              </section>
            }
            @case ('display') {
              <section class="settings-section">
                <header>
                  <h2>Display</h2>
                  <p>Control density and information shown in the interface.</p>
                </header>
                <form (submit)="save($event)">
                  <div class="toggle-row">
                    <span
                      ><b>Compact mode</b
                      ><small>Fit more information on screen with reduced spacing.</small></span
                    ><button
                      type="button"
                      role="switch"
                      aria-label="Compact mode"
                      [attr.aria-checked]="compact()"
                      [class.checked]="compact()"
                      (click)="compact.update((v) => !v)"
                    >
                      <i></i>
                    </button>
                  </div>
                  <fieldset>
                    <legend>Default dashboard</legend>
                    @for (view of dashboardOptions; track view.value) {
                      <label class="radio-row"
                        ><input
                          type="radio"
                          name="dashboard"
                          [value]="view.value"
                          [checked]="defaultDashboard() === view.value"
                          (change)="defaultDashboard.set(view.value)"
                        />{{ view.label }}</label
                      >
                    }
                  </fieldset>
                  <fieldset>
                    <legend>Sidebar behavior</legend>
                    @for (view of sidebarOptions; track view.value) {
                      <label class="radio-row"
                        ><input
                          type="radio"
                          name="sidebar"
                          [value]="view.value"
                          [checked]="sidebarBehavior() === view.value"
                          (change)="sidebarBehavior.set(view.value)"
                        />{{ view.label }}</label
                      >
                    }
                  </fieldset>
                  <button hlmBtn type="submit">Save display settings</button>
                </form>
              </section>
            }
            @case ('billing') {
              <section class="settings-section">
                <header>
                  <h2>Billing</h2>
                  <p>Manage your plan and payment methods.</p>
                </header>
                <article class="current-plan">
                  <div>
                    <span class="eyebrow">Current plan</span>
                    <h3>{{ billingPlan() }}</h3>
                    <p>{{ planDescription() }}</p>
                  </div>
                  <button hlmBtn variant="outline" type="button" (click)="planDialogOpen.set(true)">
                    Change plan
                  </button>
                  <div class="plan-progress">
                    <span
                      ><b>{{ seatCount() }}</b> of {{ seatLimit() }} seats used</span
                    ><i><b [style.width.%]="seatUsage()"></b></i>
                  </div>
                </article>
                <h3>Payment method</h3>
                <div class="payment-method">
                  <span>VISA</span>
                  <div>
                    <b>Visa ending in {{ cardLastFour() }}</b
                    ><small>Expires {{ cardExpiry() }}</small>
                  </div>
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="paymentDialogOpen.set(true)"
                  >
                    Update
                  </button>
                </div>
                <h3>Billing history</h3>
                <div class="invoice-list">
                  @for (invoice of invoices; track invoice.id) {
                    <div>
                      <span>▤</span
                      ><span
                        ><b>{{ invoice.id }}</b
                        ><small>{{ invoice.date }}</small></span
                      ><b>{{ invoice.amount }}</b
                      ><a
                        [href]="'/api/billing/invoices/' + invoice.id"
                        [download]="invoice.id + '.txt'"
                        >Download</a
                      >
                    </div>
                  }
                </div>
              </section>
            }
            @default {
              <section class="settings-section">
                <header>
                  <h2>Profile</h2>
                  <p>This is how others see you in the workspace.</p>
                </header>
                <form (submit)="save($event)">
                  <div class="profile-photo">
                    <span class="avatar profile-avatar">{{ initials() }}</span>
                    <div>
                      <button
                        hlmBtn
                        variant="outline"
                        type="button"
                        (click)="photoNotice.set(true)"
                      >
                        Change photo</button
                      ><small>JPG, GIF, or PNG. 1 MB maximum.</small>
                    </div>
                  </div>
                  @if (photoNotice()) {
                    <p class="success-callout">
                      Image uploads are ready for object-storage integration.
                    </p>
                  }
                  <label for="profile-name">Display name</label
                  ><input
                    hlmInput
                    id="profile-name"
                    #nameInput
                    [value]="name()"
                    (input)="name.set(nameInput.value)"
                  /><label for="profile-email">Email</label
                  ><input
                    hlmInput
                    id="profile-email"
                    type="email"
                    #emailInput
                    [value]="email()"
                    (input)="email.set(emailInput.value)"
                  /><label for="profile-bio">Bio</label
                  ><textarea
                    hlmTextarea
                    id="profile-bio"
                    #bioInput
                    [value]="bio()"
                    (input)="bio.set(bioInput.value)"
                  ></textarea
                  ><small>Brief description for your profile.</small
                  ><button hlmBtn type="submit">Update profile</button>
                </form>
              </section>
            }
          }
        }
      </div>
    </div>
    @if (planDialogOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="plan-dialog-title">Change plan</h2>
              <p>Choose the workspace plan that fits your team.</p>
            </div>
            <button type="button" aria-label="Close" (click)="planDialogOpen.set(false)">×</button>
          </div>
          <form (submit)="savePlan($event)">
            <fieldset class="plan-choice-list">
              <legend>Available plans</legend>
              @for (plan of billingPlans; track plan.name) {
                <label class="radio-row"
                  ><input
                    type="radio"
                    name="billing-plan"
                    [value]="plan.name"
                    [checked]="billingPlan() === plan.name"
                    (change)="billingPlan.set(plan.name)"
                  /><span
                    ><b>{{ plan.name }}</b
                    ><small>{{ plan.detail }}</small></span
                  ></label
                >
              }
            </fieldset>
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="planDialogOpen.set(false)">
                Cancel</button
              ><button hlmBtn type="submit">Save plan</button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (paymentDialogOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="payment-dialog-title">Update payment method</h2>
              <p>Only non-sensitive card metadata is retained.</p>
            </div>
            <button type="button" aria-label="Close" (click)="paymentDialogOpen.set(false)">
              ×
            </button>
          </div>
          <form (submit)="savePayment($event)">
            <label for="card-last-four">Last four digits</label
            ><input
              hlmInput
              id="card-last-four"
              inputmode="numeric"
              maxlength="4"
              pattern="[0-9]{4}"
              #cardInput
              [value]="cardLastFour()"
              (input)="cardLastFour.set(cardInput.value)"
              required
            /><label for="card-expiry">Expiry (MM/YY)</label
            ><input
              hlmInput
              id="card-expiry"
              placeholder="08/29"
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              #expiryInput
              [value]="cardExpiry()"
              (input)="cardExpiry.set(expiryInput.value)"
              required
            />
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="paymentDialogOpen.set(false)">
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!validPayment()">Update card</button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (store.notice()) {
      <div class="toast" role="status">✓ {{ store.notice() }}</div>
    }
  `,
})
export class SettingsPage {
  readonly section = input('profile');
  readonly store = inject(AdminStore);
  readonly theme = inject(ThemeStore);
  private readonly auth = inject(AuthStore);
  readonly dangerNotice = signal(false);
  readonly photoNotice = signal(false);
  readonly planDialogOpen = signal(false);
  readonly paymentDialogOpen = signal(false);
  readonly name = linkedSignal(() => this.store.settings()?.name ?? '');
  readonly email = linkedSignal(() => this.store.settings()?.email ?? '');
  readonly bio = linkedSignal(() => this.store.settings()?.bio ?? '');
  readonly language = linkedSignal(() => this.store.settings()?.language ?? 'English');
  readonly compact = linkedSignal(() => this.store.settings()?.compact ?? false);
  readonly marketingEmails = linkedSignal(() => this.store.settings()?.marketingEmails ?? false);
  readonly securityEmails = linkedSignal(() => this.store.settings()?.securityEmails ?? true);
  readonly communicationEmails = linkedSignal(
    () => this.store.settings()?.communicationEmails ?? true,
  );
  readonly mobileNotifications = linkedSignal(
    () => this.store.settings()?.mobileNotifications ?? true,
  );
  readonly desktopNotifications = linkedSignal(
    () => this.store.settings()?.desktopNotifications ?? false,
  );
  readonly defaultDashboard = linkedSignal(
    () => this.store.settings()?.defaultDashboard ?? 'analytics',
  );
  readonly sidebarBehavior = linkedSignal(
    () => this.store.settings()?.sidebarBehavior ?? 'remember',
  );
  readonly billingPlan = linkedSignal(() => this.store.settings()?.billingPlan ?? 'Professional');
  readonly cardLastFour = linkedSignal(() => this.store.settings()?.cardLastFour ?? '4242');
  readonly cardExpiry = linkedSignal(() => this.store.settings()?.cardExpiry ?? '08/29');
  readonly sections = [
    { path: '/settings', label: 'Profile', icon: '♙', exact: true },
    { path: '/settings/account', label: 'Account', icon: '⚙', exact: false },
    { path: '/settings/appearance', label: 'Appearance', icon: '◐', exact: false },
    { path: '/settings/notifications', label: 'Notifications', icon: '♢', exact: false },
    { path: '/settings/display', label: 'Display', icon: '▣', exact: false },
    { path: '/settings/billing', label: 'Billing', icon: '$', exact: false },
  ];
  readonly modes: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];
  readonly fonts: { label: string; value: ThemeFont; family: string }[] = [
    { label: 'Inter', value: 'inter', family: 'Inter Variable, sans-serif' },
    { label: 'System', value: 'system', family: 'system-ui, sans-serif' },
  ];
  readonly accents: { name: ThemeAccent; value: string }[] = [
    { name: 'violet', value: '#7c3aed' },
    { name: 'blue', value: '#2563eb' },
    { name: 'green', value: '#16a34a' },
    { name: 'orange', value: '#ea580c' },
    { name: 'rose', value: '#e11d48' },
  ];
  readonly dashboardOptions = [
    { label: 'Analytics overview', value: 'analytics' },
    { label: 'Business dashboard', value: 'business' },
    { label: 'Payment dashboard', value: 'payments' },
  ];
  readonly sidebarOptions = [
    { label: 'Remember last state', value: 'remember' },
    { label: 'Always expanded', value: 'expanded' },
    { label: 'Always collapsed', value: 'collapsed' },
  ];
  readonly emailOptions = [
    {
      key: 'communicationEmails',
      title: 'Communication emails',
      text: 'Product updates, team activity, and project changes.',
    },
    {
      key: 'marketingEmails',
      title: 'Marketing emails',
      text: 'Tips, offers, and news from the Spartan team.',
    },
    {
      key: 'securityEmails',
      title: 'Security emails',
      text: 'Important notices about account security.',
    },
  ] as const;
  readonly pushOptions = [
    {
      key: 'mobileNotifications',
      title: 'Mobile notifications',
      text: 'Receive alerts on your mobile device.',
    },
    {
      key: 'desktopNotifications',
      title: 'Desktop notifications',
      text: 'Show browser notifications on this device.',
    },
  ] as const;
  readonly invoices = [
    { id: 'INV-2026-008', date: 'Aug 1, 2026', amount: '$522.00' },
    { id: 'INV-2026-007', date: 'Jul 1, 2026', amount: '$493.00' },
    { id: 'INV-2026-006', date: 'Jun 1, 2026', amount: '$493.00' },
  ];
  readonly billingPlans = [
    { name: 'Starter', detail: 'Free for up to 3 members' },
    { name: 'Professional', detail: '$29 per member, billed monthly' },
    { name: 'Enterprise', detail: 'Unlimited seats with dedicated support' },
  ];
  constructor() {
    void this.store.loadSettings();
  }
  initials(): string {
    return this.name()
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
  }
  setting(key: keyof Settings): boolean {
    return Boolean(this[key as BooleanKey]());
  }
  toggleSetting(key: BooleanKey): void {
    this[key].update((v) => !v);
  }
  setRadius(event: Event): void {
    this.theme.radius.set(Number((event.target as HTMLInputElement).value));
  }
  planDescription(): string {
    return (
      this.billingPlans.find((plan) => plan.name === this.billingPlan())?.detail ??
      this.billingPlans[1].detail
    );
  }
  seatCount(): number {
    return this.billingPlan() === 'Starter' ? 3 : 18;
  }
  seatLimit(): string {
    return this.billingPlan() === 'Enterprise'
      ? 'unlimited'
      : this.billingPlan() === 'Starter'
        ? '3'
        : '25';
  }
  seatUsage(): number {
    return this.billingPlan() === 'Enterprise'
      ? 36
      : Math.min(100, (this.seatCount() / Number(this.seatLimit())) * 100);
  }
  validPayment(): boolean {
    return (
      /^\d{4}$/.test(this.cardLastFour()) && /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardExpiry())
    );
  }
  async save(event: Event): Promise<void> {
    event.preventDefault();
    await this.persistSettings();
  }
  async savePlan(event: Event): Promise<void> {
    event.preventDefault();
    if (await this.persistSettings()) this.planDialogOpen.set(false);
  }
  async savePayment(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.validPayment()) return;
    if (await this.persistSettings()) this.paymentDialogOpen.set(false);
  }
  private async persistSettings(): Promise<boolean> {
    const saved = await this.store.saveSettings({
      name: this.name(),
      email: this.email(),
      bio: this.bio(),
      language: this.language(),
      theme: this.theme.mode(),
      compact: this.compact(),
      marketingEmails: this.marketingEmails(),
      securityEmails: this.securityEmails(),
      communicationEmails: this.communicationEmails(),
      mobileNotifications: this.mobileNotifications(),
      desktopNotifications: this.desktopNotifications(),
      defaultDashboard: this.defaultDashboard(),
      sidebarBehavior: this.sidebarBehavior(),
      billingPlan: this.billingPlan(),
      cardLastFour: this.cardLastFour(),
      cardExpiry: this.cardExpiry(),
    });
    if (saved) await this.auth.refresh();
    return saved;
  }
}

type BooleanKey =
  | 'marketingEmails'
  | 'securityEmails'
  | 'communicationEmails'
  | 'mobileNotifications'
  | 'desktopNotifications';
