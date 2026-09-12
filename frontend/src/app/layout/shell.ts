import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { AuthStore } from '../core/auth.store';
import { ThemeStore } from '../core/theme.store';
import { AdminStore } from '../core/admin.store';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  roles?: string[];
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="app-shell" [class.sidebar-collapsed]="collapsed()">
      <aside class="sidebar" [class.open]="mobileOpen()" aria-label="Main navigation">
        <div class="brand-row">
          <a routerLink="/dashboard" class="brand" (click)="mobileOpen.set(false)"
            ><span class="brand-mark">S</span>
            @if (!collapsed()) {
              <span>Spartan Admin</span>
            }</a
          ><button
            class="mobile-close"
            type="button"
            aria-label="Close menu"
            (click)="mobileOpen.set(false)"
          >
            ×
          </button>
        </div>
        <div class="team-switcher">
          <span class="team-avatar">A</span>
          @if (!collapsed()) {
            <span><strong>Acme Inc</strong><small>Enterprise</small></span
            ><span class="chevron">⌄</span>
          }
        </div>
        <nav class="nav-scroll">
          @for (group of navGroups(); track group.label) {
            <section class="nav-group">
              @if (!collapsed()) {
                <p>{{ group.label }}</p>
              }
              @for (item of group.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  (click)="mobileOpen.set(false)"
                  [attr.title]="collapsed() ? item.label : null"
                  ><span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
                  @if (!collapsed()) {
                    <span>{{ item.label }}</span>
                    @if (item.badge) {
                      <b>{{ item.badge }}</b>
                    }
                  }
                </a>
              }
            </section>
          }
        </nav>
        <div class="profile-mini">
          <span class="avatar">{{ initials() }}</span>
          @if (!collapsed()) {
            <span
              ><strong>{{ auth.user()?.name }}</strong
              ><small>{{ auth.user()?.email }}</small></span
            ><button type="button" aria-label="Sign out" (click)="signOut()">↪</button>
          }
        </div>
      </aside>
      @if (mobileOpen()) {
        <button
          class="sidebar-scrim"
          type="button"
          aria-label="Close navigation"
          (click)="mobileOpen.set(false)"
        ></button>
      }
      <main id="main-content" class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <button
              hlmBtn
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Toggle navigation"
              (click)="toggleSidebar()"
            >
              ☰</button
            ><span class="topbar-separator"></span><span class="breadcrumb">{{ pageTitle() }}</span>
          </div>
          <div class="topbar-actions">
            <button class="command-button" type="button" (click)="commandOpen.set(true)">
              <span>⌕</span><span>Search...</span><kbd>Ctrl K</kbd></button
            ><button
              hlmBtn
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Toggle theme"
              (click)="theme.toggle()"
            >
              {{ theme.dark() ? '☀' : '◐' }}</button
            ><button
              hlmBtn
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Notifications"
              [attr.aria-expanded]="notificationsOpen()"
              (click)="notificationsOpen.update((open) => !open)"
            >
              ♢
              @if (unreadNotifications()) {
                <span class="notification-dot"></span>
              }
            </button>
            @if (notificationsOpen()) {
              <section class="notification-panel" aria-label="Notifications">
                <header>
                  <div>
                    <strong>Notifications</strong><small>{{ unreadNotifications() }} unread</small>
                  </div>
                  <button type="button" (click)="markNotificationsRead()">Mark all read</button>
                </header>
                @for (notification of notifications(); track notification.id) {
                  <article [class.unread]="!notification.read">
                    <span>{{ notification.icon }}</span>
                    <div>
                      <strong>{{ notification.title }}</strong>
                      <p>{{ notification.detail }}</p>
                      <time>{{ notification.time }}</time>
                    </div>
                  </article>
                } @empty {
                  <p class="empty-state">You're all caught up.</p>
                }
              </section>
            }
          </div>
        </header>
        <div class="page-container"><router-outlet /></div>
      </main>
    </div>
    @if (store.error()) {
      <div class="toast error-toast" role="alert">
        <span>{{ store.error() }}</span
        ><button type="button" aria-label="Dismiss error" (click)="store.clearError()">×</button>
      </div>
    }
    @if (commandOpen()) {
      <div class="modal-backdrop">
        <section
          class="command-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-title"
        >
          <h2 id="command-title" class="sr-only">Quick navigation</h2>
          <div class="command-input">
            <span>⌕</span
            ><input
              #commandInput
              aria-label="Search pages"
              placeholder="Type a command or search..."
              [value]="commandQuery()"
              (input)="commandQuery.set(commandInput.value)"
            /><button type="button" aria-label="Close search" (click)="commandOpen.set(false)">
              ×
            </button>
          </div>
          <div class="command-results">
            @for (item of commandItems(); track item.path) {
              <a [routerLink]="item.path" (click)="commandOpen.set(false)"
                ><span>{{ item.icon }}</span
                ><span>{{ item.label }}</span
                ><kbd>↵</kbd></a
              >
            } @empty {
              <p class="empty-state">No pages found.</p>
            }
          </div>
        </section>
      </div>
    }
  `,
  host: {
    '(document:keydown.control.k)': 'openCommand($event)',
    '(document:keydown.escape)': 'closeOverlays()',
  },
})
export class ShellComponent {
  readonly auth = inject(AuthStore);
  readonly theme = inject(ThemeStore);
  readonly store = inject(AdminStore);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  private readonly commandInput = viewChild<ElementRef<HTMLInputElement>>('commandInput');
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly commandOpen = signal(false);
  readonly commandQuery = signal('');
  readonly notificationsOpen = signal(false);
  private readonly baseNavGroups: NavGroup[] = [
    {
      label: 'Dashboard',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
        { label: 'Business dashboard', path: '/dashboard2', icon: '▥' },
        { label: 'Payment dashboard', path: '/payment-dashboard', icon: '◫' },
        { label: 'Transactions', path: '/payment-transactions', icon: '⇄' },
      ],
    },
    {
      label: 'General',
      items: [
        { label: 'Mail', path: '/mail', icon: '✉' },
        { label: 'Discord', path: '/discord', icon: '♯' },
        { label: 'Tasks', path: '/tasks', icon: '✓' },
        { label: 'Users', path: '/users', icon: '♙', roles: ['Owner', 'Admin'] },
        { label: 'Chats', path: '/chats', icon: '◌', badge: '3' },
        { label: 'Calendar', path: '/calendar', icon: '□' },
        { label: 'AI chat', path: '/ai-chat', icon: '✦' },
        { label: 'Kanban', path: '/kanban', icon: '▤' },
      ],
    },
    {
      label: 'Pages',
      items: [
        { label: 'Components', path: '/components', icon: '◈' },
        { label: 'Column pricing', path: '/pricing/column', icon: '$' },
        { label: 'Table pricing', path: '/pricing/table', icon: '▦' },
        { label: 'Single pricing', path: '/pricing/single', icon: '●' },
        { label: 'Settings', path: '/settings', icon: '⚙' },
        { label: 'Help center', path: '/help-center', icon: '?' },
      ],
    },
    {
      label: 'System states',
      items: [
        { label: 'Unauthorized', path: '/unauthorized', icon: '⌾' },
        { label: 'Forbidden', path: '/forbidden', icon: '⊘' },
        { label: 'Not found', path: '/not-found', icon: '⌕' },
        { label: 'Server error', path: '/internal-server-error', icon: '!' },
        { label: 'Maintenance', path: '/maintenance-error', icon: '⚒' },
      ],
    },
  ];
  readonly navGroups = computed(() =>
    this.baseNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.roles || item.roles.includes(this.auth.user()?.role ?? ''),
        ),
      }))
      .filter((group) => group.items.length),
  );
  readonly allItems = computed(() => this.navGroups().flatMap((group) => group.items));
  readonly commandItems = computed(() => {
    const query = this.commandQuery().trim().toLowerCase();
    return query
      ? this.allItems().filter((item) => item.label.toLowerCase().includes(query))
      : this.allItems().slice(0, 8);
  });
  readonly notifications = signal([
    {
      id: 'release',
      icon: '✓',
      title: 'Release deployed',
      detail: 'Version 2.4 is now live.',
      time: '3 minutes ago',
      read: false,
    },
    {
      id: 'member',
      icon: '♙',
      title: 'New team member',
      detail: 'Aiko joined the workspace.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 'report',
      icon: '▤',
      title: 'Monthly report ready',
      detail: 'Your August report is available.',
      time: 'Yesterday',
      read: true,
    },
  ]);
  readonly unreadNotifications = computed(
    () => this.notifications().filter((notification) => !notification.read).length,
  );
  readonly initials = computed(
    () =>
      this.auth
        .user()
        ?.name.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? 'SA',
  );
  readonly pageTitle = computed(() => {
    const path = this.currentUrl().split('?')[0];
    return (
      this.allItems().find((item) => item.path === path)?.label ??
      path.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ??
      'Dashboard'
    );
  });
  private appliedSidebarBehavior: string | undefined;
  constructor() {
    void this.store.loadSettings();
    effect(() => {
      if (this.commandOpen()) setTimeout(() => this.commandInput()?.nativeElement.focus());
    });
    effect(() => {
      const settings = this.store.settings();
      if (typeof document !== 'undefined')
        document.documentElement.classList.toggle('compact', settings?.compact ?? false);
      if (!settings) {
        this.appliedSidebarBehavior = undefined;
        return;
      }
      if (settings.sidebarBehavior === this.appliedSidebarBehavior) return;
      this.appliedSidebarBehavior = settings.sidebarBehavior;
      const remembered =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('spartan-sidebar-collapsed') === 'true';
      this.collapsed.set(
        settings.sidebarBehavior === 'collapsed' ||
          (settings.sidebarBehavior === 'remember' && remembered),
      );
    });
  }
  toggleSidebar(): void {
    if (matchMedia('(max-width: 800px)').matches) this.mobileOpen.update((open) => !open);
    else {
      this.collapsed.update((value) => !value);
      if (this.store.settings()?.sidebarBehavior === 'remember')
        localStorage.setItem('spartan-sidebar-collapsed', String(this.collapsed()));
    }
  }
  openCommand(event: Event): void {
    event.preventDefault();
    this.commandOpen.set(true);
  }
  markNotificationsRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }
  closeOverlays(): void {
    this.commandOpen.set(false);
    this.notificationsOpen.set(false);
    this.mobileOpen.set(false);
  }
  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/sign-in');
  }
}
