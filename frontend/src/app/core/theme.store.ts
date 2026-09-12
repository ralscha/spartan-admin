import { computed, DestroyRef, effect, inject, Service, signal } from '@angular/core';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeAccent = 'violet' | 'blue' | 'green' | 'orange' | 'rose';
export type ThemeFont = 'inter' | 'system';

const accents = new Set<ThemeAccent>(['violet', 'blue', 'green', 'orange', 'rose']);

@Service()
export class ThemeStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemPreference =
    typeof matchMedia === 'undefined' ? undefined : matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.systemPreference?.matches ?? false);

  readonly mode = signal<ThemeMode>('system');
  readonly accent = signal<ThemeAccent>('violet');
  readonly font = signal<ThemeFont>('inter');
  readonly radius = signal(10);
  readonly dark = computed(
    () => this.mode() === 'dark' || (this.mode() === 'system' && this.systemDark()),
  );

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const mode = localStorage.getItem('spartan-theme');
      if (mode === 'light' || mode === 'dark' || mode === 'system') this.mode.set(mode);
      const accent = localStorage.getItem('spartan-accent') as ThemeAccent | null;
      if (accent && accents.has(accent)) this.accent.set(accent);
      if (localStorage.getItem('spartan-font') === 'system') this.font.set('system');
      const storedRadius = localStorage.getItem('spartan-radius');
      const radius = storedRadius === null ? Number.NaN : Number(storedRadius);
      if (Number.isFinite(radius) && radius >= 0 && radius <= 20) this.radius.set(radius);
    }

    const updateSystemPreference = (event: MediaQueryListEvent): void =>
      this.systemDark.set(event.matches);
    this.systemPreference?.addEventListener('change', updateSystemPreference);
    this.destroyRef.onDestroy(() =>
      this.systemPreference?.removeEventListener('change', updateSystemPreference),
    );

    effect(() => {
      if (typeof document === 'undefined' || typeof localStorage === 'undefined') return;
      document.documentElement.classList.toggle('dark', this.dark());
      document.documentElement.dataset['accent'] = this.accent();
      document.documentElement.dataset['font'] = this.font();
      document.documentElement.style.setProperty('--radius', `${this.radius()}px`);
      localStorage.setItem('spartan-theme', this.mode());
      localStorage.setItem('spartan-accent', this.accent());
      localStorage.setItem('spartan-font', this.font());
      localStorage.setItem('spartan-radius', String(this.radius()));
    });
  }
  toggle(): void {
    this.mode.set(this.dark() ? 'light' : 'dark');
  }
}
