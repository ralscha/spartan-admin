import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { DashboardData } from './dashboard-data';
import { downloadTextFile } from '../../core/download';
import { Transaction } from '../../core/models';

type PaymentMetric = 'volume' | 'transactions';
type AnalyticsTab = 'hourly' | 'regions' | 'failures';

const PAYMENT_DATA = [
  { date: 'Jan 01', volume: 142500, transactions: 1245 },
  { date: 'Jan 08', volume: 168200, transactions: 1482 },
  { date: 'Jan 15', volume: 156800, transactions: 1356 },
  { date: 'Jan 22', volume: 184300, transactions: 1623 },
  { date: 'Jan 29', volume: 172100, transactions: 1498 },
  { date: 'Feb 05', volume: 198400, transactions: 1745 },
  { date: 'Feb 12', volume: 215600, transactions: 1892 },
  { date: 'Feb 19', volume: 203200, transactions: 1789 },
  { date: 'Feb 26', volume: 228900, transactions: 2012 },
  { date: 'Mar 04', volume: 241500, transactions: 2134 },
  { date: 'Mar 11', volume: 256800, transactions: 2267 },
  { date: 'Mar 18', volume: 268400, transactions: 2389 },
  { date: 'Mar 25', volume: 284100, transactions: 2512 },
  { date: 'Apr 01', volume: 298700, transactions: 2645 },
  { date: 'Apr 08', volume: 312400, transactions: 2789 },
  { date: 'Apr 15', volume: 328900, transactions: 2912 },
];
const METHODS = [
  { name: 'Credit Card', value: 45.2, amount: 382640 },
  { name: 'Debit Card', value: 23.8, amount: 201520 },
  { name: 'Bank Transfer', value: 15.4, amount: 130380 },
  { name: 'Digital Wallet', value: 10.2, amount: 86360 },
  { name: 'Cryptocurrency', value: 3.8, amount: 32180 },
  { name: 'Other', value: 1.6, amount: 13540 },
];
const GATEWAYS = [
  {
    name: 'Stripe',
    logo: 'S',
    status: 'operational',
    uptime: 99.98,
    latency: '45ms',
    success: 99.2,
  },
  {
    name: 'PayPal',
    logo: 'P',
    status: 'operational',
    uptime: 99.95,
    latency: '62ms',
    success: 98.8,
  },
  {
    name: 'Square',
    logo: 'Sq',
    status: 'degraded',
    uptime: 98.45,
    latency: '128ms',
    success: 96.5,
    incident: 'High latency detected',
  },
  {
    name: 'Adyen',
    logo: 'A',
    status: 'operational',
    uptime: 99.99,
    latency: '38ms',
    success: 99.5,
  },
  {
    name: 'Braintree',
    logo: 'B',
    status: 'operational',
    uptime: 99.92,
    latency: '55ms',
    success: 98.9,
  },
];
const QUICK_ACTIONS = [
  { label: 'Create Invoice', icon: '▤', description: 'Generate new invoice' },
  { label: 'Send Payment', icon: '➤', description: 'Transfer funds' },
  { label: 'Request Payment', icon: '⇩', description: 'Create payment link' },
  { label: 'Add Card', icon: '▣', description: 'New payment method' },
  { label: 'Process Refund', icon: '↶', description: 'Refund transaction' },
  { label: 'Payment Link', icon: '⌁', description: 'Share payment URL' },
  { label: 'Security', icon: '◇', description: 'Fraud settings' },
  { label: 'Settings', icon: '⚙', description: 'Payment config' },
];
const HOURLY = [
  87, 54, 32, 18, 12, 29, 68, 102, 127, 145, 161, 176, 183, 189, 181, 174, 168, 215, 198, 145, 87,
];
const REGIONS = [
  { name: 'North America', payments: 4521, volume: 892340, growth: 12.4 },
  { name: 'Europe', payments: 3245, volume: 645890, growth: 8.7 },
  { name: 'Asia Pacific', payments: 2876, volume: 523400, growth: 23.5 },
  { name: 'Latin America', payments: 1234, volume: 234560, growth: 15.2 },
  { name: 'Middle East', payments: 876, volume: 178900, growth: 31.8 },
  { name: 'Africa', payments: 432, volume: 89340, growth: 45.2 },
];
const FAILURES = [
  { reason: 'Insufficient Funds', count: 234, percentage: 35.2 },
  { reason: 'Card Declined', count: 187, percentage: 28.1 },
  { reason: 'Expired Card', count: 98, percentage: 14.7 },
  { reason: 'Invalid CVV', count: 67, percentage: 10.1 },
  { reason: 'Network Error', count: 45, percentage: 6.8 },
  { reason: 'Other', count: 34, percentage: 5.1 },
];

@Component({
  selector: 'app-payment-dashboard',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, HlmButton, HlmInput],
  template: `
    <section class="page-heading compact-heading">
      <div>
        <h1>Payment Dashboard</h1>
        <p>Monitor transactions, track revenue, and manage payment operations.</p>
      </div>
    </section>
    @if (resource.error()) {
      <div class="error-callout" role="alert">{{ resource.error() }}</div>
    }
    <div class="metric-grid summary-metrics">
      @for (metric of metrics; track metric.title) {
        <article class="metric-card">
          <div class="metric-top">
            <i>{{ metric.icon }}</i
            ><b [class.down]="metric.growth < 0"
              >{{ metric.growth > 0 ? '+' : '' }}{{ metric.growth }}%</b
            >
          </div>
          <p>{{ metric.title }}</p>
          <strong>{{ metric.current }}</strong
          ><small>from {{ metric.previous }} ↗</small>
        </article>
      }
    </div>

    <article class="panel quick-actions-panel">
      <div class="panel-header">
        <div>
          <h2>Quick Actions</h2>
          <p>Common payment operations</p>
        </div>
      </div>
      <div class="payment-quick-grid">
        @for (action of quickActions; track action.label) {
          <button type="button" [class.primary]="$index === 0" (click)="openAction(action.label)">
            <span>{{ action.icon }}</span
            ><strong>{{ action.label }}</strong
            ><small>{{ action.description }}</small>
          </button>
        }
      </div>
    </article>

    <div class="dashboard-feature-grid payment-feature-grid">
      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Payment Volume</h2>
            <p>
              {{
                paymentMetric() === 'volume'
                  ? 'Total payment volume over time'
                  : 'Number of transactions processed'
              }}
            </p>
          </div>
          <div class="panel-actions">
            <select
              #metricSelect
              aria-label="Payment chart metric"
              [value]="paymentMetric()"
              (change)="paymentMetric.set(asMetric(metricSelect.value))"
            >
              <option value="volume">Volume ($)</option>
              <option value="transactions">Transactions</option></select
            ><select
              #rangeSelect
              aria-label="Payment chart range"
              [value]="paymentRange()"
              (change)="paymentRange.set(+rangeSelect.value)"
            >
              <option value="4">Last month</option>
              <option value="12">Last 3 months</option>
              <option value="16">Last 6 months</option></select
            ><button
              hlmBtn
              variant="outline"
              type="button"
              aria-label="Export payment volume"
              (click)="exportVolume()"
            >
              ⇩
            </button>
          </div>
        </div>
        <svg
          class="area-chart payment-chart"
          viewBox="0 0 620 300"
          preserveAspectRatio="none"
          role="img"
          [attr.aria-label]="
            paymentMetric() === 'volume' ? 'Payment volume over time' : 'Transactions over time'
          "
        >
          <g class="chart-grid">
            <line x1="0" y1="60" x2="620" y2="60" />
            <line x1="0" y1="120" x2="620" y2="120" />
            <line x1="0" y1="180" x2="620" y2="180" />
            <line x1="0" y1="240" x2="620" y2="240" />
          </g>
          <polyline class="desktop-line" [attr.points]="paymentPoints()" />
        </svg>
        <div class="chart-axis">
          @for (item of visiblePaymentData(); track item.date) {
            <span>{{ item.date }}</span>
          }
        </div>
      </article>

      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Payment Methods</h2>
            <p>Breakdown by payment type</p>
          </div>
          <select
            #periodSelect
            aria-label="Payment methods period"
            [value]="methodPeriod()"
            (change)="methodPeriod.set(periodSelect.value)"
          >
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
        </div>
        <div class="payment-method-layout">
          <div class="payment-method-donut">
            <div><strong>$847k</strong><span>Total</span></div>
          </div>
          <div class="method-list">
            @for (method of methods; track method.name) {
              <div>
                <span><i [attr.data-index]="$index"></i>{{ method.name }}</span
                ><b>{{ method.value }}%</b>
              </div>
            }
          </div>
        </div>
      </article>
    </div>

    <div class="payment-lower-grid">
      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Recent Payments</h2>
            <p>Latest payment transactions</p>
          </div>
          <a routerLink="/payment-transactions">View All ↗</a>
        </div>
        <div class="recent-payment-list">
          @for (payment of recentPayments(); track payment.id) {
            <article>
              <span class="avatar">{{ initials(payment.customer) }}</span>
              <div>
                <strong>{{ payment.customer }}</strong
                ><small>{{ payment.email }}</small
                ><small>{{ payment.reference }}</small>
              </div>
              <span
                ><b>{{ payment.amount | currency: payment.currency }}</b
                ><small class="status-pill" [attr.data-status]="payment.status">{{
                  payment.status
                }}</small
                ><small>{{ relativeDate($index) }}</small></span
              >
              <details class="row-menu">
                <summary [attr.aria-label]="'Actions for ' + payment.reference">⋯</summary>
                <div>
                  <button type="button" (click)="selectedPayment.set(payment)">View Details</button
                  ><button type="button" (click)="copyReference(payment.reference)">
                    Copy Reference
                  </button>
                  <hr />
                  <button type="button" (click)="refund(payment)">Process Refund</button>
                </div>
              </details>
            </article>
          }
        </div>
      </article>

      <article class="panel feature-panel gateway-panel">
        <div class="panel-header">
          <div>
            <h2>Payment Gateways</h2>
            <p>Real-time gateway status</p>
          </div>
          <span class="status-dot">4/5 Operational</span>
        </div>
        <div class="gateway-list">
          @for (gateway of gateways; track gateway.name) {
            <article>
              <div>
                <b>{{ gateway.logo }}</b
                ><span
                  ><strong>{{ gateway.name }}</strong>
                  @if (gateway.incident) {
                    <small>{{ gateway.incident }}</small>
                  }</span
                ><em [attr.data-status]="gateway.status">{{ gateway.status }}</em>
              </div>
              <dl>
                <div>
                  <dt>Uptime</dt>
                  <dd>{{ gateway.uptime }}%</dd>
                </div>
                <div>
                  <dt>Latency</dt>
                  <dd>{{ gateway.latency }}</dd>
                </div>
                <div>
                  <dt>Success</dt>
                  <dd>{{ gateway.success }}%</dd>
                </div>
              </dl>
              <div class="gateway-progress">
                <i [style.width.%]="gateway.success" [attr.data-status]="gateway.status"></i>
              </div>
            </article>
          }
        </div>
      </article>
    </div>

    <article class="panel payment-analytics">
      <div class="panel-header">
        <div>
          <h2>Payment Analytics</h2>
          <p>Detailed breakdown of payment patterns</p>
        </div>
      </div>
      <div class="insight-tabs payment-tabs" role="tablist">
        @for (tab of analyticsTabs; track tab.id) {
          <button
            type="button"
            role="tab"
            [class.active]="analyticsTab() === tab.id"
            [attr.aria-selected]="analyticsTab() === tab.id"
            (click)="analyticsTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      @if (analyticsTab() === 'hourly') {
        <div class="analytics-content">
          <div class="analytics-stats">
            <article>
              <small>Peak Hour</small><strong>2:00 PM</strong><span>189 transactions</span>
            </article>
            <article>
              <small>Low Activity</small><strong>4:00 AM</strong><span>12 transactions</span>
            </article>
            <article><small>Avg/Hour</small><strong>110</strong><span>transactions</span></article>
          </div>
          <div class="hourly-chart" role="img" aria-label="Payment activity by hour">
            @for (value of hourly; track $index) {
              <i [style.height.%]="value / 2.2"></i>
            }
          </div>
        </div>
      }
      @if (analyticsTab() === 'regions') {
        <div class="analytics-content region-list">
          @for (region of regions; track region.name) {
            <article>
              <i [attr.data-index]="$index"></i
              ><span
                ><strong>{{ region.name }}</strong
                ><small>{{ region.payments | number }} payments</small></span
              ><span
                ><strong>{{ region.volume | currency: 'USD' : 'symbol' : '1.0-0' }}</strong
                ><small class="positive">+{{ region.growth }}%</small></span
              >
            </article>
          }
        </div>
      }
      @if (analyticsTab() === 'failures') {
        <div class="analytics-content">
          <div class="analytics-stats">
            <article class="failure">
              <small>Total Failures</small><strong>665</strong><span>Last 30 days</span>
            </article>
            <article>
              <small>Failure Rate</small><strong>1.8%</strong
              ><span class="positive">-0.3% from last month</span>
            </article>
            <article>
              <small>Top Issue</small><strong>Funds</strong><span>35.2% of failures</span>
            </article>
          </div>
          <div class="failure-list">
            @for (item of failures; track item.reason) {
              <article>
                <span
                  ><strong>{{ item.reason }}</strong
                  ><b>{{ item.count }}</b></span
                >
                <div><i [style.width.%]="item.percentage"></i></div>
                <small>{{ item.percentage }}%</small>
              </article>
            }
          </div>
        </div>
      }
    </article>

    @if (activeAction()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-action-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="payment-action-title">{{ activeAction() }}</h2>
              <p>Complete this payment operation securely.</p>
            </div>
            <button type="button" aria-label="Close" (click)="activeAction.set('')">×</button>
          </div>
          <form (submit)="completeAction($event)">
            <label for="action-reference">Reference or description</label
            ><input
              hlmInput
              id="action-reference"
              #referenceInput
              [value]="actionReference()"
              (input)="actionReference.set(referenceInput.value)"
              required
            /><label for="action-amount">Amount</label
            ><input
              hlmInput
              id="action-amount"
              type="number"
              min="0"
              step="0.01"
              #amountInput
              [value]="actionAmount()"
              (input)="actionAmount.set(+amountInput.value)"
            />
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="activeAction.set('')">
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!actionReference().trim()">Continue</button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (selectedPayment(); as payment) {
      <div class="modal-backdrop">
        <section
          class="form-dialog detail-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-detail-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="payment-detail-title">{{ payment.reference }}</h2>
              <p>Payment details</p>
            </div>
            <button type="button" aria-label="Close" (click)="selectedPayment.set(null)">×</button>
          </div>
          <dl>
            <div>
              <dt>Customer</dt>
              <dd>{{ payment.customer }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ payment.email }}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{{ payment.amount | currency: payment.currency }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span class="status-pill" [attr.data-status]="payment.status">{{
                  payment.status
                }}</span>
              </dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{{ payment.method.replaceAll('_', ' ') }}</dd>
            </div>
          </dl>
          <div class="dialog-actions detail-actions">
            <button hlmBtn variant="outline" type="button" (click)="refund(payment)">
              Process refund</button
            ><button hlmBtn type="button" (click)="selectedPayment.set(null)">Done</button>
          </div>
        </section>
      </div>
    }
    @if (notice()) {
      <div class="toast" role="status">✓ {{ notice() }}</div>
    }
  `,
})
export class PaymentDashboardPage {
  readonly resource = inject(DashboardData);
  readonly metrics = [
    {
      title: 'Total Revenue',
      current: '$847,234.89',
      previous: '$762,140.52',
      growth: 11.2,
      icon: '$',
    },
    {
      title: 'Successful Payments',
      current: '12,847',
      previous: '11,234',
      growth: 14.3,
      icon: '▣',
    },
    { title: 'Active Customers', current: '8,492', previous: '7,841', growth: 8.3, icon: '♙' },
    {
      title: 'Refunds Processed',
      current: '$12,340.00',
      previous: '$15,892.00',
      growth: -22.3,
      icon: '↶',
    },
  ];
  readonly quickActions = QUICK_ACTIONS;
  readonly methods = METHODS;
  readonly gateways = GATEWAYS;
  readonly hourly = HOURLY;
  readonly regions = REGIONS;
  readonly failures = FAILURES;
  readonly analyticsTabs: { id: AnalyticsTab; label: string }[] = [
    { id: 'hourly', label: 'Hourly' },
    { id: 'regions', label: 'Regions' },
    { id: 'failures', label: 'Failures' },
  ];
  readonly paymentMetric = signal<PaymentMetric>('volume');
  readonly paymentRange = signal(12);
  readonly methodPeriod = signal('month');
  readonly analyticsTab = signal<AnalyticsTab>('hourly');
  readonly activeAction = signal('');
  readonly actionReference = signal('');
  readonly actionAmount = signal(0);
  readonly selectedPayment = signal<Transaction | null>(null);
  readonly statusOverrides = signal<Record<string, string>>({});
  readonly notice = signal('');
  readonly visiblePaymentData = computed(() => PAYMENT_DATA.slice(-this.paymentRange()));
  readonly recentPayments = computed(() =>
    (this.resource.value()?.transactions ?? [])
      .slice(0, 6)
      .map((payment) => ({
        ...payment,
        status: this.statusOverrides()[payment.id] ?? payment.status,
      })),
  );
  asMetric(value: string): PaymentMetric {
    return value === 'transactions' ? 'transactions' : 'volume';
  }
  paymentPoints(): string {
    const rows = this.visiblePaymentData();
    const key = this.paymentMetric();
    const max = Math.max(...rows.map((row) => row[key]));
    return rows
      .map(
        (row, index) =>
          `${(index / Math.max(1, rows.length - 1)) * 620},${280 - (row[key] / max) * 245}`,
      )
      .join(' ');
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
  relativeDate(index: number): string {
    return index === 0
      ? '2 min ago'
      : index === 1
        ? '15 min ago'
        : index < 4
          ? `${index} hours ago`
          : 'Today';
  }
  openAction(label: string): void {
    this.activeAction.set(label);
    this.actionReference.set('');
    this.actionAmount.set(0);
  }
  completeAction(event: Event): void {
    event.preventDefault();
    const action = this.activeAction();
    this.activeAction.set('');
    this.flash(`${action} completed`);
  }
  exportVolume(): void {
    const metric = this.paymentMetric();
    downloadTextFile(
      'payment-volume.csv',
      [
        `date,${metric}`,
        ...this.visiblePaymentData().map((row) => `${row.date},${row[metric]}`),
      ].join('\n'),
    );
    this.flash('Payment data exported');
  }
  async copyReference(reference: string): Promise<void> {
    await navigator.clipboard.writeText(reference);
    this.flash('Reference copied');
  }
  refund(payment: Transaction): void {
    this.statusOverrides.update((items) => ({ ...items, [payment.id]: 'refunded' }));
    this.selectedPayment.set(null);
    this.flash(`${payment.reference} refunded`);
  }
  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2200);
  }
}
