import { RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

describe('server rendering strategy', () => {
  it('prerenders public showcase routes', () => {
    expect(serverRoutes.find((route) => route.path === '')?.renderMode).toBe(RenderMode.Prerender);
    expect(serverRoutes.find((route) => route.path === 'components')?.renderMode).toBe(
      RenderMode.Prerender,
    );
  });

  it('keeps authenticated and unmatched routes client-rendered', () => {
    expect(serverRoutes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Client });
  });
});
