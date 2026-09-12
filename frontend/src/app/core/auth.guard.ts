import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { AdminStore } from './admin.store';

export const authGuard: CanActivateChildFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (await auth.restore(true)) return true;
  return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
};

export const userAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (!(await auth.restore())) return router.createUrlTree(['/sign-in']);
  const role = auth.user()?.role;
  return role === 'Owner' || role === 'Admin' ? true : router.createUrlTree(['/forbidden']);
};

export const guestGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthStore);
  const admin = inject(AdminStore);
  const router = inject(Router);
  if (!(await auth.restore(true))) return true;
  await admin.loadSettings();
  const dashboards: Record<string, string> = {
    analytics: '/dashboard',
    business: '/dashboard2',
    payments: '/payment-dashboard',
  };
  const destination = dashboards[admin.settings()?.defaultDashboard ?? 'analytics'] ?? '/dashboard';
  return router.createUrlTree([destination]);
};
