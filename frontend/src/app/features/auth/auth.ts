import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../../core/auth.store';
import { AdminStore } from '../../core/admin.store';
import { ThemeStore } from '../../core/theme.store';

type AuthMode = 'sign-in' | 'sign-up' | 'reset-password';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, HlmButton, HlmInput],
  template: `
    <main class="auth-page" [class.two-column]="variant() === 2">
      @if (variant() === 2) {
        <section class="auth-brand-panel">
          <a routerLink="/" class="brand inverted"
            ><span class="brand-mark">S</span>Spartan Admin</a
          >
          <div>
            <span class="eyebrow">Build with confidence</span>
            <h1>Everything your team needs,<br />in one thoughtful workspace.</h1>
            <p>
              Signal-native Angular, accessible Spartan UI, and a reliable Go API—ready to become
              your product.
            </p>
          </div>
          <blockquote>
            “The strongest foundations disappear beneath the product you build on top.”
            <footer>— The Spartan team</footer>
          </blockquote>
        </section>
      }
      <section class="auth-form-panel">
        <div class="auth-top">
          <a routerLink="/" class="brand"
            ><span class="brand-mark">S</span>
            @if (variant() !== 2) {
              Spartan Admin
            }</a
          ><button
            hlmBtn
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Toggle theme"
            (click)="theme.toggle()"
          >
            {{ theme.dark() ? '☀' : '◐' }}
          </button>
        </div>
        <div class="auth-card">
          <div class="auth-heading">
            <h1>{{ heading() }}</h1>
            <p>{{ subheading() }}</p>
          </div>
          @if (success()) {
            <div class="success-callout" role="status">✓ {{ success() }}</div>
          }
          <form (submit)="submit($event)" novalidate>
            @if (mode() === 'sign-up') {
              <label for="name">Full name</label
              ><input
                hlmInput
                id="name"
                autocomplete="name"
                placeholder="Nyein Phyo"
                [value]="name()"
                (input)="name.set(nameInput.value)"
                #nameInput
              />
            }
            <label for="email">Email address</label
            ><input
              hlmInput
              id="email"
              type="email"
              autocomplete="email"
              placeholder="admin@example.com"
              [value]="email()"
              (input)="email.set(emailInput.value)"
              #emailInput
            />
            @if (mode() !== 'reset-password') {
              <div class="label-row">
                <label for="password">Password</label>
                @if (mode() === 'sign-in') {
                  <a routerLink="/reset-password-1">Forgot password?</a>
                }
              </div>
              <div class="password-field">
                <input
                  hlmInput
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [attr.autocomplete]="mode() === 'sign-up' ? 'new-password' : 'current-password'"
                  placeholder="••••••••••••"
                  [value]="password()"
                  (input)="password.set(passwordInput.value)"
                  #passwordInput
                /><button
                  type="button"
                  aria-label="Toggle password visibility"
                  (click)="showPassword.update((shown) => !shown)"
                >
                  {{ showPassword() ? 'Hide' : 'Show' }}
                </button>
              </div>
              @if (mode() === 'sign-up') {
                <div class="password-requirements">
                  <span [class.met]="password().length >= 8">✓ 8+ characters</span
                  ><span [class.met]="hasUpper() && hasLower()">✓ Upper & lowercase</span
                  ><span [class.met]="hasNumber()">✓ Number</span
                  ><span [class.met]="hasSpecial()">✓ Special character</span>
                </div>
                <label for="confirm-password">Confirm password</label>
                <div class="password-field">
                  <input
                    hlmInput
                    id="confirm-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="••••••••••••"
                    [value]="confirmPassword()"
                    (input)="confirmPassword.set(confirmInput.value)"
                    #confirmInput
                  />
                </div>
                @if (confirmPassword() && !passwordsMatch()) {
                  <p class="form-error" role="alert">Passwords do not match.</p>
                }
                <label class="terms-row"
                  ><input
                    type="checkbox"
                    [checked]="acceptedTerms()"
                    (change)="acceptedTerms.update((accepted) => !accepted)"
                  />
                  <span>I agree to the terms and privacy policy.</span></label
                >
              }
            }
            @if (auth.error()) {
              <p class="form-error" role="alert">{{ auth.error() }}</p>
            }
            <button
              hlmBtn
              size="lg"
              class="submit-button"
              type="submit"
              [disabled]="auth.pending() || !valid()"
            >
              {{ auth.pending() ? 'Please wait…' : actionLabel() }}
            </button>
          </form>
          @if (mode() !== 'reset-password') {
            <div class="auth-divider"><span>or continue with</span></div>
            <div class="social-buttons">
              <button hlmBtn variant="outline" type="button" (click)="demoSocial('Google')">
                G&nbsp; Google</button
              ><button hlmBtn variant="outline" type="button" (click)="demoSocial('GitHub')">
                ◉&nbsp; GitHub
              </button>
            </div>
          }
          <p class="auth-switch">
            {{ switchText() }} <a [routerLink]="switchLink()">{{ switchAction() }}</a>
          </p>
          @if (mode() === 'sign-in') {
            <div class="demo-credentials">
              <b>Demo account</b
              ><button type="button" (click)="fillDemo()">admin@example.com · Spartan300</button>
            </div>
          }
        </div>
      </section>
    </main>
  `,
})
export class AuthPage {
  readonly mode = input<AuthMode>('sign-in');
  readonly variant = input(1);
  readonly auth = inject(AuthStore);
  readonly theme = inject(ThemeStore);
  private readonly admin = inject(AdminStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly acceptedTerms = signal(false);
  readonly showPassword = signal(false);
  readonly success = signal('');
  readonly hasUpper = computed(() => /[A-Z]/.test(this.password()));
  readonly hasLower = computed(() => /[a-z]/.test(this.password()));
  readonly hasNumber = computed(() => /\d/.test(this.password()));
  readonly hasSpecial = computed(() => /[!@#$%^&*]/.test(this.password()));
  readonly passwordsMatch = computed(() => this.password() === this.confirmPassword());
  readonly valid = computed(
    () =>
      this.email().includes('@') &&
      (this.mode() === 'reset-password' ||
        (this.password().length >= 8 &&
          (this.mode() !== 'sign-up' ||
            (this.name().trim().length >= 2 &&
              this.hasUpper() &&
              this.hasLower() &&
              this.hasNumber() &&
              this.hasSpecial() &&
              this.passwordsMatch() &&
              this.acceptedTerms())))),
  );
  readonly heading = computed(
    () =>
      ({
        'sign-in': 'Welcome back',
        'sign-up': 'Create your account',
        'reset-password': 'Reset your password',
      })[this.mode()],
  );
  readonly subheading = computed(
    () =>
      ({
        'sign-in': 'Enter your credentials to access your workspace.',
        'sign-up': 'Start building your workspace in a few seconds.',
        'reset-password': 'We’ll send a recovery link to your email.',
      })[this.mode()],
  );
  readonly actionLabel = computed(
    () =>
      ({ 'sign-in': 'Sign in', 'sign-up': 'Create account', 'reset-password': 'Send reset link' })[
        this.mode()
      ],
  );
  readonly switchText = computed(() =>
    this.mode() === 'sign-up'
      ? 'Already have an account?'
      : this.mode() === 'sign-in'
        ? 'New to Spartan Admin?'
        : 'Remembered your password?',
  );
  readonly switchAction = computed(() =>
    this.mode() === 'sign-up'
      ? 'Sign in'
      : this.mode() === 'sign-in'
        ? 'Create an account'
        : 'Back to sign in',
  );
  readonly switchLink = computed(() =>
    this.mode() === 'sign-up' ? '/sign-in' : this.mode() === 'sign-in' ? '/sign-up-1' : '/sign-in',
  );
  fillDemo(): void {
    this.email.set('admin@example.com');
    this.password.set('Spartan300');
  }
  demoSocial(provider: string): void {
    this.success.set(`${provider} sign-in is ready for your OAuth credentials.`);
  }
  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.valid()) return;
    if (this.mode() === 'reset-password') {
      this.success.set(await this.auth.resetPassword(this.email()));
      return;
    }
    const ok =
      this.mode() === 'sign-up'
        ? await this.auth.signUp(this.name(), this.email(), this.password())
        : await this.auth.signIn(this.email(), this.password());
    if (ok) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
        await this.router.navigateByUrl(returnUrl);
        return;
      }
      await this.admin.loadSettings();
      const dashboards: Record<string, string> = {
        analytics: '/dashboard',
        business: '/dashboard2',
        payments: '/payment-dashboard',
      };
      const destination =
        dashboards[this.admin.settings()?.defaultDashboard ?? 'analytics'] ?? '/dashboard';
      await this.router.navigateByUrl(destination);
    }
  }
}
