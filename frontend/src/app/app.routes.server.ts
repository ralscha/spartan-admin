import { RenderMode, ServerRoute } from '@angular/ssr';

const prerenderedRoutes = [
  '',
  'components',
  'sign-in',
  'sign-in-1',
  'sign-in-2',
  'sign-up-1',
  'sign-up-2',
  'reset-password-1',
  'reset-password-2',
  'unauthorized',
  'forbidden',
  'not-found',
  'internal-server-error',
  'maintenance-error',
];

export const serverRoutes: ServerRoute[] = [
  ...prerenderedRoutes.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  { path: '**', renderMode: RenderMode.Client },
];
