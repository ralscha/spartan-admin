import { Routes } from '@angular/router';
import { authGuard, guestGuard, userAdminGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing').then((m) => m.LandingPage),
    title: 'Spartan Admin',
  },
  ...['sign-in', 'sign-in-1', 'sign-in-2'].map((path): Routes[number] => ({
    path,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage),
    data: { mode: 'sign-in', variant: path.endsWith('2') ? 2 : 1 },
    title: 'Sign in',
  })),
  ...['sign-up-1', 'sign-up-2'].map((path): Routes[number] => ({
    path,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage),
    data: { mode: 'sign-up', variant: path.endsWith('2') ? 2 : 1 },
    title: 'Create account',
  })),
  ...['reset-password-1', 'reset-password-2'].map((path): Routes[number] => ({
    path,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage),
    data: { mode: 'reset-password', variant: path.endsWith('2') ? 2 : 1 },
    title: 'Reset password',
  })),
  {
    path: 'components',
    loadComponent: () =>
      import('./features/components/component-gallery').then((m) => m.ComponentGalleryPage),
    title: 'Spartan component gallery',
  },
  {
    path: '',
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
        data: { variant: 'analytics' },
        title: 'Dashboard',
      },
      {
        path: 'dashboard2',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
        data: { variant: 'business' },
        title: 'Business dashboard',
      },
      {
        path: 'payment-dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
        data: { variant: 'payments' },
        title: 'Payment dashboard',
      },
      {
        path: 'payment-transactions',
        loadComponent: () => import('./features/data/transactions').then((m) => m.TransactionsPage),
        title: 'Payment transactions',
      },
      {
        path: 'users',
        canActivate: [userAdminGuard],
        loadComponent: () => import('./features/data/users').then((m) => m.UsersPage),
        title: 'Users',
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/data/tasks').then((m) => m.TasksPage),
        title: 'Tasks',
      },
      {
        path: 'kanban',
        loadComponent: () => import('./features/kanban/kanban').then((m) => m.KanbanPage),
        title: 'Kanban',
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar').then((m) => m.CalendarPage),
        title: 'Calendar',
      },
      {
        path: 'mail',
        loadComponent: () => import('./features/communication/mail').then((m) => m.MailPage),
        title: 'Mail',
      },
      {
        path: 'chats',
        loadComponent: () => import('./features/communication/chats').then((m) => m.ChatsPage),
        title: 'Chats',
      },
      {
        path: 'ai-chat',
        loadComponent: () => import('./features/communication/ai-chat').then((m) => m.AiChatPage),
        title: 'AI chat',
      },
      {
        path: 'discord',
        loadComponent: () => import('./features/communication/discord').then((m) => m.DiscordPage),
        title: 'Discord',
      },
      {
        path: 'help-center',
        loadComponent: () => import('./features/help/help').then((m) => m.HelpPage),
        title: 'Help center',
      },
      {
        path: 'pricing/:style',
        loadComponent: () => import('./features/pricing/pricing').then((m) => m.PricingPage),
        title: 'Pricing',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
        data: { section: 'profile' },
        title: 'Settings',
      },
      {
        path: 'settings/:section',
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
        title: 'Settings',
      },
    ],
  },
  ...[
    ['unauthorized', '401'],
    ['forbidden', '403'],
    ['not-found', '404'],
    ['internal-server-error', '500'],
    ['maintenance-error', 'maintenance'],
  ].map(([path, code]): Routes[number] => ({
    path,
    loadComponent: () => import('./features/errors/error').then((m) => m.ErrorPage),
    data: { code },
    title: code === 'maintenance' ? 'Maintenance' : `${code} error`,
  })),
  { path: '**', redirectTo: 'not-found' },
];
