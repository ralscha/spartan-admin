import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { AuthStore } from '../../core/auth.store';
import { AnalyticsDashboardPage } from './analytics-dashboard';
import { BusinessDashboardPage } from './business-dashboard';
import { DashboardData } from './dashboard-data';
import { PaymentDashboardPage } from './payment-dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    RouterLink,
    HlmButton,
    AnalyticsDashboardPage,
    BusinessDashboardPage,
    PaymentDashboardPage,
  ],
  providers: [DashboardData],
  template: `
    @if (variant() === 'analytics') {
      <app-analytics-dashboard />
    } @else if (variant() === 'business') {
      <app-business-dashboard />
    } @else if (variant() === 'payments') {
      <app-payment-dashboard />
    } @else {
      <section class="page-heading">
        <div>
          <h1>{{ title() }}</h1>
          <p>{{ description() }}</p>
        </div>
        <div class="heading-actions">
          <select aria-label="Date range">
            <option>This month</option>
            <option>Last 30 days</option>
            <option>This year</option></select
          ><a hlmBtn variant="outline" href="/api/dashboard/export" download="dashboard-report.csv"
            >⇩ Download</a
          >
        </div>
      </section>
      @if (resource.error()) {
        <div class="error-callout" role="alert">
          {{ resource.error() }}
          <button hlmBtn variant="outline" size="sm" type="button" (click)="resource.reload()">
            Retry
          </button>
        </div>
      }
      @if (resource.loading() && !data()) {
        <div class="skeleton-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div></div>
          }
        </div>
      }
      @if (data(); as dashboard) {
        <div class="metric-grid">
          @for (metric of metrics(); track metric.label) {
            <article class="metric-card">
              <div class="metric-top">
                <span>{{ metric.label }}</span
                ><i>{{ metric.icon }}</i>
              </div>
              <strong
                >{{ metric.prefix }}{{ metric.value | number: metric.format
                }}{{ metric.suffix }}</strong
              >
              <p>
                <b [class.down]="metric.down">{{ metric.delta }}</b> from last month
              </p>
              <div class="spark-bars">
                @for (bar of metric.spark; track $index) {
                  <i [style.height.%]="bar"></i>
                }
              </div>
            </article>
          }
        </div>
        <div class="dashboard-grid">
          <article class="panel chart-panel">
            <div class="panel-header">
              <div>
                <h2>{{ variant() === 'payments' ? 'Payment volume' : 'Revenue overview' }}</h2>
                <p>
                  {{
                    variant() === 'business'
                      ? 'Gross revenue across your top channels'
                      : 'Monthly performance across the selected period'
                  }}
                </p>
              </div>
              <div class="chart-legend">
                <span><i></i>Current period</span>
              </div>
            </div>
            <div class="bar-chart" role="img" aria-label="Monthly revenue bar chart">
              @for (value of dashboard.series; track $index) {
                <div>
                  <i [style.height.%]="chartHeight(value)"></i><span>{{ months[$index] }}</span>
                </div>
              }
            </div>
          </article>
          <article class="panel overview-panel">
            <div class="panel-header">
              <div>
                <h2>{{ variant() === 'payments' ? 'Gateway status' : 'Goal overview' }}</h2>
                <p>Current period progress</p>
              </div>
              <span class="status-dot">Live</span>
            </div>
            <div class="donut" [style.--progress]="dashboard.conversion * 3.6 + 'deg'">
              <div>
                <strong>{{ dashboard.conversion / 100 | percent: '1.1-1' }}</strong
                ><span>conversion</span>
              </div>
            </div>
            <div class="goal-stats">
              <span
                ><b>{{ dashboard.activeUsers }}</b> Active users</span
              ><span
                ><b>{{ dashboard.subscriptions | number }}</b> Subscriptions</span
              >
            </div>
          </article>
        </div>
        <div class="dashboard-lower">
          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>Recent transactions</h2>
                <p>Latest payment activity from your customers.</p>
              </div>
              <a routerLink="/payment-transactions">View all →</a>
            </div>
            <div class="transaction-list">
              @for (transaction of dashboard.transactions; track transaction.id) {
                <div>
                  <span class="avatar">{{ initials(transaction.customer) }}</span
                  ><span
                    ><strong>{{ transaction.customer }}</strong
                    ><small>{{ transaction.email }}</small></span
                  ><span class="transaction-amount"
                    ><b>{{ transaction.amount | currency: transaction.currency }}</b
                    ><small [attr.data-status]="transaction.status">{{
                      transaction.status
                    }}</small></span
                  >
                </div>
              }
            </div>
          </article>
          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>{{ variant() === 'business' ? 'Top products' : 'Team activity' }}</h2>
                <p>Highlights from the last seven days.</p>
              </div>
            </div>
            <div class="activity-list">
              @for (item of activity; track item.title) {
                <div>
                  <i>{{ item.icon }}</i
                  ><span
                    ><strong>{{ item.title }}</strong
                    ><small>{{ item.detail }}</small></span
                  ><time>{{ item.time }}</time>
                </div>
              }
            </div>
            <button hlmBtn variant="outline" class="wide-button" type="button">
              View activity log
            </button>
          </article>
        </div>
      }
    }
  `,
})
export class DashboardPage {
  readonly variant = input('analytics');
  readonly resource = inject(DashboardData);
  readonly auth = inject(AuthStore);
  readonly data = this.resource.value;
  readonly months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  readonly activity = [
    { icon: '♙', title: 'New customer joined', detail: 'Aiko created a workspace', time: '2m' },
    { icon: '$', title: 'Payment received', detail: 'Annual professional plan', time: '1h' },
    { icon: '✓', title: 'Release deployed', detail: 'Version 2.4 is now live', time: '3h' },
    { icon: '✦', title: 'Milestone reached', detail: '$45k monthly revenue', time: '1d' },
  ];
  readonly title = computed(() =>
    this.variant() === 'business'
      ? 'Business overview'
      : this.variant() === 'payments'
        ? 'Payment dashboard'
        : `Welcome back, ${this.auth.user()?.name.split(' ')[0] ?? 'there'}`,
  );
  readonly description = computed(() =>
    this.variant() === 'business'
      ? 'Track revenue, customers, and product performance.'
      : this.variant() === 'payments'
        ? 'Monitor payment volume, gateways, and settlements.'
        : "Here's what's happening with your business today.",
  );
  readonly metrics = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.variant() === 'payments'
      ? [
          {
            label: 'Payment volume',
            value: d.revenue,
            prefix: '$',
            suffix: '',
            format: '1.0-0',
            delta: '+18.7%',
            icon: '$',
            down: false,
            spark: [35, 43, 39, 55, 63, 58, 78, 91],
          },
          {
            label: 'Successful payments',
            value: 94.8,
            prefix: '',
            suffix: '%',
            format: '1.1-1',
            delta: '+2.4%',
            icon: '✓',
            down: false,
            spark: [65, 68, 72, 69, 79, 83, 87, 93],
          },
          {
            label: 'Processing',
            value: 12,
            prefix: '',
            suffix: '',
            format: '1.0-0',
            delta: '-4.1%',
            icon: '⇄',
            down: false,
            spark: [82, 70, 62, 75, 54, 48, 41, 37],
          },
          {
            label: 'Disputed',
            value: 3,
            prefix: '',
            suffix: '',
            format: '1.0-0',
            delta: '+0.8%',
            icon: '!',
            down: true,
            spark: [20, 35, 18, 43, 28, 50, 38, 46],
          },
        ]
      : [
          {
            label: 'Total revenue',
            value: d.revenue,
            prefix: '$',
            suffix: '',
            format: '1.0-0',
            delta: '+20.1%',
            icon: '$',
            down: false,
            spark: [30, 45, 38, 62, 55, 78, 70, 92],
          },
          {
            label: 'Subscriptions',
            value: d.subscriptions,
            prefix: '',
            suffix: '',
            format: '1.0-0',
            delta: '+18.2%',
            icon: '♙',
            down: false,
            spark: [40, 35, 52, 48, 66, 60, 80, 88],
          },
          {
            label: 'Active now',
            value: d.activeUsers,
            prefix: '',
            suffix: '',
            format: '1.0-0',
            delta: '+12.5%',
            icon: '◉',
            down: false,
            spark: [35, 48, 43, 61, 58, 75, 72, 86],
          },
          {
            label: 'Conversion',
            value: d.conversion,
            prefix: '',
            suffix: '%',
            format: '1.1-1',
            delta: '-1.2%',
            icon: '↗',
            down: true,
            spark: [80, 72, 84, 66, 70, 55, 60, 48],
          },
        ];
  });
  chartHeight(value: number): number {
    return Math.round((value / 6000) * 100);
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
