import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { computed, Service } from '@angular/core';
import { Dashboard } from '../../core/models';

@Service()
export class DashboardData {
  private readonly resource = httpResource<Dashboard | null>(() => '/api/dashboard', {
    defaultValue: null,
    debugName: 'dashboard-overview',
  });

  readonly value = computed(() => (this.resource.hasValue() ? this.resource.value() : null));
  readonly loading = this.resource.isLoading;
  readonly status = this.resource.status;
  readonly error = computed(() => {
    const error = this.resource.error();
    if (!error) return '';
    if (error instanceof HttpErrorResponse) return error.error?.error ?? error.message;
    return error instanceof Error ? error.message : 'Unable to load dashboard data';
  });

  reload(): boolean {
    return this.resource.reload();
  }
}
