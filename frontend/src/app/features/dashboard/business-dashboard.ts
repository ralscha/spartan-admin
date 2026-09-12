import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { DashboardData } from './dashboard-data';
import { csvCell, downloadTextFile } from '../../core/download';
import { Transaction } from '../../core/models';

type InsightTab = 'growth' | 'demographics' | 'regions';

interface Product {
  name: string;
  sales: number;
  revenue: string;
  growth: string;
  rating: number;
  stock: number;
  category: string;
}

const SALES = [
  { month: 'Jan', sales: 12500, target: 15000 },
  { month: 'Feb', sales: 18200, target: 15000 },
  { month: 'Mar', sales: 16800, target: 15000 },
  { month: 'Apr', sales: 22400, target: 20000 },
  { month: 'May', sales: 24600, target: 20000 },
  { month: 'Jun', sales: 28200, target: 25000 },
  { month: 'Jul', sales: 31500, target: 25000 },
  { month: 'Aug', sales: 29800, target: 25000 },
  { month: 'Sep', sales: 33200, target: 30000 },
  { month: 'Oct', sales: 35100, target: 30000 },
  { month: 'Nov', sales: 38900, target: 35000 },
  { month: 'Dec', sales: 42300, target: 35000 },
];
const REVENUE = [
  { category: 'subscriptions', label: 'Subscriptions', value: 45, amount: 24500 },
  { category: 'sales', label: 'One-time Sales', value: 30, amount: 16300 },
  { category: 'services', label: 'Services', value: 15, amount: 8150 },
  { category: 'partnerships', label: 'Partnerships', value: 10, amount: 5430 },
];
const PRODUCTS: Product[] = [
  {
    name: 'Premium Dashboard',
    sales: 2847,
    revenue: '$142,350',
    growth: '+23%',
    rating: 4.8,
    stock: 145,
    category: 'Software',
  },
  {
    name: 'Analytics Pro',
    sales: 1923,
    revenue: '$96,150',
    growth: '+18%',
    rating: 4.6,
    stock: 67,
    category: 'Tools',
  },
  {
    name: 'Mobile App Suite',
    sales: 1456,
    revenue: '$72,800',
    growth: '+12%',
    rating: 4.9,
    stock: 234,
    category: 'Mobile',
  },
  {
    name: 'Enterprise License',
    sales: 892,
    revenue: '$178,400',
    growth: '+8%',
    rating: 4.7,
    stock: 12,
    category: 'Enterprise',
  },
  {
    name: 'Basic Subscription',
    sales: 3421,
    revenue: '$68,420',
    growth: '+31%',
    rating: 4.4,
    stock: 999,
    category: 'Subscription',
  },
];
const CUSTOMER_GROWTH = [
  { month: 'Jan', fresh: 245, returning: 890, churn: 45 },
  { month: 'Feb', fresh: 312, returning: 934, churn: 52 },
  { month: 'Mar', fresh: 289, returning: 1023, churn: 38 },
  { month: 'Apr', fresh: 456, returning: 1156, churn: 61 },
  { month: 'May', fresh: 523, returning: 1298, churn: 47 },
  { month: 'Jun', fresh: 634, returning: 1445, churn: 55 },
];
const DEMOGRAPHICS = [
  { label: '18-24', customers: 2847, share: '18.0%', growth: '+15.2%' },
  { label: '25-34', customers: 4521, share: '28.5%', growth: '+8.7%' },
  { label: '35-44', customers: 3982, share: '25.1%', growth: '+3.4%' },
  { label: '45-54', customers: 2734, share: '17.2%', growth: '+1.2%' },
  { label: '55+', customers: 1763, share: '11.2%', growth: '-2.1%' },
];
const REGIONS = [
  { label: 'North America', customers: 6847, revenue: '$847,523', growth: '+12.3%' },
  { label: 'Europe', customers: 4521, revenue: '$563,891', growth: '+9.7%' },
  { label: 'Asia Pacific', customers: 2892, revenue: '$321,456', growth: '+18.4%' },
  { label: 'Latin America', customers: 1123, revenue: '$187,234', growth: '+15.8%' },
  { label: 'Others', customers: 464, revenue: '$67,891', growth: '+5.2%' },
];

@Component({
  selector: 'app-business-dashboard',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, HlmButton, HlmInput],
  template: `
    <section class="page-heading">
      <div>
        <h1>Business Dashboard</h1>
        <p>Monitor your business performance and key metrics in real-time</p>
      </div>
      <div class="heading-actions">
        <button hlmBtn type="button" (click)="saleOpen.set(true)">＋ New Sale</button>
        <details class="action-menu">
          <summary>⚙ Actions</summary>
          <div>
            <button type="button" (click)="generateReport()">▤ Generate Report</button
            ><button type="button" (click)="exportBusinessData()">⇩ Export Data</button>
            <hr />
            <a routerLink="/settings/display">⚙ Dashboard Settings</a>
          </div>
        </details>
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

    <div class="dashboard-feature-grid">
      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Sales Performance</h2>
            <p>Monthly sales vs targets</p>
          </div>
          <div class="panel-actions">
            <select
              #salesSelect
              aria-label="Sales period"
              [value]="salesRange()"
              (change)="salesRange.set(+salesSelect.value)"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option></select
            ><button hlmBtn variant="outline" type="button" (click)="exportSales()">Export</button>
          </div>
        </div>
        <div class="line-chart-labels">
          <span><i></i>Sales</span><span><i></i>Target</span>
        </div>
        <svg
          class="area-chart business-chart"
          viewBox="0 0 620 300"
          preserveAspectRatio="none"
          role="img"
          aria-label="Monthly sales compared with targets"
        >
          <g class="chart-grid">
            <line x1="0" y1="60" x2="620" y2="60" />
            <line x1="0" y1="120" x2="620" y2="120" />
            <line x1="0" y1="180" x2="620" y2="180" />
            <line x1="0" y1="240" x2="620" y2="240" />
          </g>
          <polyline class="target-line" [attr.points]="salesPoints('target')" />
          <polyline class="desktop-line" [attr.points]="salesPoints('sales')" />
        </svg>
        <div class="chart-axis">
          @for (item of visibleSales(); track item.month) {
            <span>{{ item.month }}</span>
          }
        </div>
      </article>

      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Revenue Breakdown</h2>
            <p>Revenue distribution by source</p>
          </div>
          <div class="panel-actions">
            <select
              #categorySelect
              aria-label="Revenue category"
              [value]="revenueCategory()"
              (change)="revenueCategory.set(categorySelect.value)"
            >
              @for (item of revenue; track item.category) {
                <option [value]="item.category" [selected]="revenueCategory() === item.category">
                  {{ item.label }}
                </option>
              }</select
            ><button hlmBtn variant="outline" type="button" (click)="exportRevenue()">
              Export
            </button>
          </div>
        </div>
        <div class="revenue-breakdown">
          <div class="revenue-donut">
            <div>
              <strong>{{ activeRevenue().amount | currency: 'USD' : 'symbol' : '1.0-0' }}</strong
              ><span>Revenue</span>
            </div>
          </div>
          <div class="revenue-list">
            @for (item of revenue; track item.category) {
              <button
                type="button"
                [class.active]="revenueCategory() === item.category"
                (click)="revenueCategory.set(item.category)"
              >
                <span><i [attr.data-index]="$index"></i>{{ item.label }}</span
                ><span
                  ><b>{{ item.amount | currency: 'USD' : 'symbol' : '1.0-0' }}</b
                  ><small>{{ item.value }}%</small></span
                >
              </button>
            }
          </div>
        </div>
      </article>

      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Latest customer transactions</p>
          </div>
          <a routerLink="/payment-transactions">View All ↗</a>
        </div>
        <div class="transaction-list business-transactions">
          @for (transaction of recentTransactions(); track transaction.id) {
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
              ><button
                class="icon-action"
                type="button"
                [attr.aria-label]="'View ' + transaction.reference"
                (click)="selectedTransaction.set(transaction)"
              >
                ⋯
              </button>
            </div>
          }
        </div>
      </article>

      <article class="panel feature-panel">
        <div class="panel-header">
          <div>
            <h2>Top Products</h2>
            <p>Best performing products this month</p>
          </div>
          <button
            hlmBtn
            variant="outline"
            size="sm"
            type="button"
            (click)="showAllProducts.update((value) => !value)"
          >
            {{ showAllProducts() ? 'Show less' : 'View All' }}
          </button>
        </div>
        <div class="product-list">
          @for (product of visibleProducts(); track product.name) {
            <article>
              <b>#{{ $index + 1 }}</b>
              <div>
                <span
                  ><strong>{{ product.name }}</strong
                  ><small
                    >{{ product.category }} · ★ {{ product.rating }} ·
                    {{ product.sales | number }} sales</small
                  ></span
                ><span
                  ><strong>{{ product.revenue }}</strong
                  ><small class="positive">{{ product.growth }}</small></span
                >
                <div class="stock-track"><i [style.width.%]="stockPercent(product.stock)"></i></div>
                <small>Stock: {{ product.stock }}</small>
              </div>
            </article>
          }
        </div>
      </article>
    </div>

    <article class="panel customer-insights">
      <div class="panel-header">
        <div>
          <h2>Customer Insights</h2>
          <p>Growth trends and demographics</p>
        </div>
      </div>
      <div class="insight-tabs" role="tablist">
        @for (tab of insightTabs; track tab.id) {
          <button
            role="tab"
            type="button"
            [class.active]="insightTab() === tab.id"
            [attr.aria-selected]="insightTab() === tab.id"
            (click)="insightTab.set(tab.id)"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        }
      </div>
      @if (insightTab() === 'growth') {
        <div class="growth-layout">
          <div>
            <h3>Customer Growth Trends</h3>
            <div
              class="growth-chart"
              role="img"
              aria-label="New, returning and churned customers by month"
            >
              @for (item of customerGrowth; track item.month) {
                <div>
                  <span
                    ><i class="fresh" [style.height.%]="item.fresh / 7"></i
                    ><i class="returning" [style.height.%]="item.returning / 16"></i
                    ><i class="churn" [style.height.%]="item.churn"></i></span
                  ><small>{{ item.month }}</small>
                </div>
              }
            </div>
          </div>
          <aside>
            <h3>Key Metrics</h3>
            <article>
              <span>Total Customers</span><strong>15,847</strong
              ><small>↑ +12.5% from last month</small>
            </article>
            <article>
              <span>Retention Rate</span><strong>92.4%</strong><small>↑ +2.1% improvement</small>
            </article>
            <article>
              <span>Avg. LTV</span><strong>$2,847</strong><small>↑ +8.3% growth</small>
            </article>
          </aside>
        </div>
      } @else {
        <div class="insight-table table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ insightTab() === 'regions' ? 'Region' : 'Age Group' }}</th>
                <th>Customers</th>
                <th>{{ insightTab() === 'regions' ? 'Revenue' : 'Percentage' }}</th>
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              @for (row of insightRows(); track row.label) {
                <tr>
                  <td>
                    <strong>{{ row.label }}</strong>
                  </td>
                  <td>{{ row.customers | number }}</td>
                  <td>{{ row.detail }}</td>
                  <td>
                    <span [class.negative]="row.growth.startsWith('-')" class="positive">{{
                      row.growth
                    }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </article>

    @if (saleOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-sale-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="new-sale-title">Record a new sale</h2>
              <p>Add it to the recent business activity.</p>
            </div>
            <button type="button" aria-label="Close" (click)="saleOpen.set(false)">×</button>
          </div>
          <form (submit)="saveSale($event)">
            <label for="sale-customer">Customer</label
            ><input
              hlmInput
              id="sale-customer"
              #customerInput
              [value]="saleCustomer()"
              (input)="saleCustomer.set(customerInput.value)"
              required
            /><label for="sale-email">Email</label
            ><input
              hlmInput
              id="sale-email"
              type="email"
              #emailInput
              [value]="saleEmail()"
              (input)="saleEmail.set(emailInput.value)"
              required
            />
            <div class="form-row">
              <div>
                <label for="sale-product">Product</label
                ><select
                  id="sale-product"
                  #productInput
                  [value]="saleProduct()"
                  (change)="saleProduct.set(productInput.value)"
                >
                  @for (product of products; track product.name) {
                    <option>{{ product.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="sale-amount">Amount</label
                ><input
                  hlmInput
                  id="sale-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  #amountInput
                  [value]="saleAmount()"
                  (input)="saleAmount.set(+amountInput.value)"
                  required
                />
              </div>
            </div>
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="saleOpen.set(false)">
                Cancel</button
              ><button
                hlmBtn
                type="submit"
                [disabled]="
                  !saleCustomer().trim() || !saleEmail().includes('@') || saleAmount() <= 0
                "
              >
                Save sale
              </button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (selectedTransaction(); as transaction) {
      <div class="modal-backdrop">
        <section
          class="form-dialog detail-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="transaction-detail-title">{{ transaction.reference }}</h2>
              <p>Transaction details</p>
            </div>
            <button type="button" aria-label="Close" (click)="selectedTransaction.set(null)">
              ×
            </button>
          </div>
          <dl>
            <div>
              <dt>Customer</dt>
              <dd>{{ transaction.customer }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ transaction.email }}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{{ transaction.amount | currency: transaction.currency }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span class="status-pill" [attr.data-status]="transaction.status">{{
                  transaction.status
                }}</span>
              </dd>
            </div>
            <div>
              <dt>Gateway</dt>
              <dd>{{ transaction.gateway }}</dd>
            </div>
          </dl>
          <div class="dialog-actions detail-actions">
            <button
              hlmBtn
              variant="outline"
              type="button"
              (click)="copyReference(transaction.reference)"
            >
              Copy reference</button
            ><button hlmBtn type="button" (click)="selectedTransaction.set(null)">Done</button>
          </div>
        </section>
      </div>
    }
    @if (notice()) {
      <div class="toast" role="status">✓ {{ notice() }}</div>
    }
  `,
})
export class BusinessDashboardPage {
  readonly resource = inject(DashboardData);
  readonly metrics = [
    { title: 'Total Revenue', current: '$54,230', previous: '$48,420', growth: 12, icon: '$' },
    { title: 'Active Customers', current: '2,350', previous: '2,234', growth: 5.2, icon: '♙' },
    { title: 'Total Orders', current: '1,247', previous: '1,274', growth: -2.1, icon: '▣' },
    { title: 'Conversion Rate', current: '3.24%', previous: '2.99%', growth: 8.3, icon: '⌁' },
  ];
  readonly revenue = REVENUE;
  readonly products = PRODUCTS;
  readonly customerGrowth = CUSTOMER_GROWTH;
  readonly insightTabs: { id: InsightTab; label: string; icon: string }[] = [
    { id: 'growth', label: 'Growth', icon: '↗' },
    { id: 'demographics', label: 'Demographics', icon: '♙' },
    { id: 'regions', label: 'Regions', icon: '⌖' },
  ];
  readonly salesRange = signal(12);
  readonly revenueCategory = signal('sales');
  readonly insightTab = signal<InsightTab>('growth');
  readonly showAllProducts = signal(false);
  readonly saleOpen = signal(false);
  readonly saleCustomer = signal('');
  readonly saleEmail = signal('');
  readonly saleProduct = signal(PRODUCTS[0].name);
  readonly saleAmount = signal(1999);
  readonly localTransactions = signal<Transaction[]>([]);
  readonly selectedTransaction = signal<Transaction | null>(null);
  readonly notice = signal('');
  readonly visibleSales = computed(() => SALES.slice(-this.salesRange()));
  readonly activeRevenue = computed(
    () => REVENUE.find((item) => item.category === this.revenueCategory()) ?? REVENUE[1],
  );
  readonly recentTransactions = computed(() =>
    [...this.localTransactions(), ...(this.resource.value()?.transactions ?? [])].slice(0, 5),
  );
  readonly visibleProducts = computed(() =>
    PRODUCTS.slice(0, this.showAllProducts() ? PRODUCTS.length : 4),
  );
  readonly insightRows = computed(() =>
    this.insightTab() === 'regions'
      ? REGIONS.map((row) => ({
          label: row.label,
          customers: row.customers,
          detail: row.revenue,
          growth: row.growth,
        }))
      : DEMOGRAPHICS.map((row) => ({
          label: row.label,
          customers: row.customers,
          detail: row.share,
          growth: row.growth,
        })),
  );
  salesPoints(key: 'sales' | 'target'): string {
    const rows = this.visibleSales();
    return rows
      .map(
        (item, index) => `${(index / Math.max(1, rows.length - 1)) * 620},${285 - item[key] / 175}`,
      )
      .join(' ');
  }
  stockPercent(stock: number): number {
    return Math.min(100, stock);
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
  exportSales(): void {
    downloadTextFile(
      'sales-performance.csv',
      [
        'month,sales,target',
        ...this.visibleSales().map((item) => `${item.month},${item.sales},${item.target}`),
      ].join('\n'),
    );
    this.flash('Sales data exported');
  }
  exportRevenue(): void {
    downloadTextFile(
      'revenue-breakdown.csv',
      [
        'category,percentage,amount',
        ...REVENUE.map((item) => `${csvCell(item.label)},${item.value},${item.amount}`),
      ].join('\n'),
    );
    this.flash('Revenue data exported');
  }
  exportBusinessData(): void {
    const rows = this.recentTransactions().map((item) =>
      [item.reference, item.customer, item.amount, item.status].map(csvCell).join(','),
    );
    downloadTextFile(
      'business-dashboard.csv',
      ['reference,customer,amount,status', ...rows].join('\n'),
    );
    this.flash('Business data exported');
  }
  generateReport(): void {
    downloadTextFile(
      'business-report.txt',
      `Business Dashboard Report\n\nTotal revenue: $54,230\nActive customers: 2,350\nTotal orders: 1,247\nConversion rate: 3.24%`,
      'text/plain;charset=utf-8',
    );
    this.flash('Report generated');
  }
  saveSale(event: Event): void {
    event.preventDefault();
    const now = new Date().toISOString();
    this.localTransactions.update((items) => [
      {
        id: `sale_${Date.now()}`,
        reference: `SALE-${Date.now().toString().slice(-6)}`,
        customer: this.saleCustomer().trim(),
        email: this.saleEmail().trim(),
        amount: this.saleAmount(),
        currency: 'USD',
        status: 'completed',
        method: 'credit_card',
        gateway: 'stripe',
        country: 'United States',
        createdAt: now,
        fee: this.saleAmount() * 0.029,
        riskScore: 3,
        description: this.saleProduct(),
      },
      ...items,
    ]);
    this.saleOpen.set(false);
    this.saleCustomer.set('');
    this.saleEmail.set('');
    this.flash('Sale recorded');
  }
  async copyReference(reference: string): Promise<void> {
    await navigator.clipboard.writeText(reference);
    this.flash('Reference copied');
  }
  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2200);
  }
}
