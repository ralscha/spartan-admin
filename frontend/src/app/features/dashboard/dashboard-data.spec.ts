import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Dashboard } from '../../core/models';
import { DashboardData } from './dashboard-data';

const dashboard: Dashboard = {
  revenue: 45_231.89,
  subscriptions: 2_350,
  activeUsers: 573,
  conversion: 12.5,
  series: [1_860, 2_210],
  transactions: [],
};

describe('DashboardData', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardData, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('exposes a successful response as signal state', async () => {
    const resource = TestBed.inject(DashboardData);
    TestBed.tick();
    http.expectOne('/api/dashboard').flush(dashboard);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.value()).toEqual(dashboard);
    expect(resource.error()).toBe('');
    expect(resource.loading()).toBe(false);
  });

  it('turns an API failure into a displayable message', async () => {
    const resource = TestBed.inject(DashboardData);
    TestBed.tick();
    http
      .expectOne('/api/dashboard')
      .flush(
        { error: 'Dashboard unavailable' },
        { status: 503, statusText: 'Service Unavailable' },
      );
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.value()).toBeNull();
    expect(resource.error()).toBe('Dashboard unavailable');
  });
});
