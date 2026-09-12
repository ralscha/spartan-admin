import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AdminStore } from '../../core/admin.store';
import { Transaction } from '../../core/models';

type ColumnKey =
  | 'reference'
  | 'customer'
  | 'amount'
  | 'status'
  | 'method'
  | 'gateway'
  | 'fee'
  | 'net'
  | 'country'
  | 'createdAt'
  | 'riskScore';
type SortKey = 'reference' | 'amount' | 'fee' | 'createdAt';

@Component({
  selector: 'app-transactions',
  imports: [CurrencyPipe, DatePipe, HlmButton, HlmInput],
  template: `
    <section class="page-heading">
      <div>
        <h1>Payment transactions</h1>
        <p>Monitor, filter, and export every payment event.</p>
      </div>
      <details class="transaction-export">
        <summary>Export</summary>
        <div>
          <a href="/api/transactions/export" download="transactions.csv">Export as CSV</a
          ><button type="button" (click)="exportJSON()">Export as JSON</button>
        </div>
      </details>
    </section>

    <div class="state-card-grid payment-states">
      <article>
        <i class="blue">TX</i
        ><span
          ><small>Total Transactions</small><strong>{{ store.transactions().length }}</strong
          ><em>Last 30 days</em></span
        ><b>+14.3%</b>
      </article>
      <article>
        <i class="green">OK</i
        ><span
          ><small>Successful</small><strong>{{ statusCount('completed') }}</strong
          ><em>{{ completionRate() }}% success rate</em></span
        ><b>+15.2%</b>
      </article>
      <article>
        <i class="amber">PN</i
        ><span
          ><small>Pending</small><strong>{{ statusCount('pending') }}</strong
          ><em>Awaiting processing</em></span
        ><b>-8.4%</b>
      </article>
      <article>
        <i class="red">FL</i
        ><span
          ><small>Failed</small><strong>{{ statusCount('failed') }}</strong
          ><em>Needs attention</em></span
        ><b>-22.1%</b>
      </article>
    </div>

    <section class="panel data-panel transaction-panel">
      <div class="table-toolbar transaction-toolbar">
        <div class="search-field">
          <span>&#8981;</span
          ><input
            hlmInput
            #searchInput
            aria-label="Search transactions"
            placeholder="Search by customer..."
            [value]="query()"
            (input)="query.set(searchInput.value); page.set(1)"
          />
        </div>
        <select
          #statusSelect
          aria-label="Transaction status"
          [value]="status()"
          (change)="status.set(statusSelect.value); page.set(1)"
        >
          <option value="all">Status</option>
          @for (item of statuses; track item) {
            <option [value]="item">{{ label(item) }}</option>
          }
        </select>
        <select
          #methodSelect
          aria-label="Payment method"
          [value]="method()"
          (change)="method.set(methodSelect.value); page.set(1)"
        >
          <option value="all">Method</option>
          @for (item of methods; track item) {
            <option [value]="item">{{ label(item) }}</option>
          }
        </select>
        <select
          #gatewaySelect
          aria-label="Payment gateway"
          [value]="gateway()"
          (change)="gateway.set(gatewaySelect.value); page.set(1)"
        >
          <option value="all">Gateway</option>
          @for (item of gateways; track item) {
            <option [value]="item">{{ label(item) }}</option>
          }
        </select>
        @if (filtersActive()) {
          <button hlmBtn variant="ghost" size="sm" type="button" (click)="resetFilters()">
            Reset &times;
          </button>
        }
        <details class="transaction-columns">
          <summary>View</summary>
          <div>
            <strong>Toggle columns</strong>
            @for (column of columns; track column.key) {
              <label
                ><input
                  type="checkbox"
                  [checked]="columnVisible(column.key)"
                  (change)="toggleColumn(column.key)"
                />{{ column.label }}</label
              >
            }
          </div>
        </details>
      </div>

      <div class="table-scroll">
        <table class="data-table transaction-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all visible transactions"
                  [checked]="allPageSelected()"
                  (change)="togglePageSelection()"
                />
              </th>
              @if (columnVisible('reference')) {
                <th>
                  <button type="button" (click)="sortBy('reference')">
                    Reference {{ sortIndicator('reference') }}
                  </button>
                </th>
              }
              @if (columnVisible('customer')) {
                <th>Customer</th>
              }
              @if (columnVisible('amount')) {
                <th>
                  <button type="button" (click)="sortBy('amount')">
                    Amount {{ sortIndicator('amount') }}
                  </button>
                </th>
              }
              @if (columnVisible('status')) {
                <th>Status</th>
              }
              @if (columnVisible('method')) {
                <th>Method</th>
              }
              @if (columnVisible('gateway')) {
                <th>Gateway</th>
              }
              @if (columnVisible('fee')) {
                <th>
                  <button type="button" (click)="sortBy('fee')">
                    Fee {{ sortIndicator('fee') }}
                  </button>
                </th>
              }
              @if (columnVisible('net')) {
                <th>Net</th>
              }
              @if (columnVisible('country')) {
                <th>Country</th>
              }
              @if (columnVisible('createdAt')) {
                <th>
                  <button type="button" (click)="sortBy('createdAt')">
                    Date {{ sortIndicator('createdAt') }}
                  </button>
                </th>
              }
              @if (columnVisible('riskScore')) {
                <th>Risk</th>
              }
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (tx of paged(); track tx.id) {
              <tr [class.selected]="selectedRows().has(tx.id)">
                <td>
                  <input
                    type="checkbox"
                    [attr.aria-label]="'Select ' + tx.reference"
                    [checked]="selectedRows().has(tx.id)"
                    (change)="toggleRow(tx.id)"
                  />
                </td>
                @if (columnVisible('reference')) {
                  <td>
                    <strong class="mono">{{ tx.reference }}</strong
                    ><small>{{ tx.description }}</small>
                  </td>
                }
                @if (columnVisible('customer')) {
                  <td>
                    <div class="user-cell">
                      <span class="avatar">{{ initials(tx.customer) }}</span
                      ><span
                        ><strong>{{ tx.customer }}</strong
                        ><small>{{ tx.email }}</small></span
                      >
                    </div>
                  </td>
                }
                @if (columnVisible('amount')) {
                  <td class="numeric">
                    <strong>{{ tx.amount | currency: tx.currency }}</strong>
                  </td>
                }
                @if (columnVisible('status')) {
                  <td>
                    <span class="status-pill" [attr.data-status]="tx.status"
                      ><i></i>{{ tx.status }}</span
                    >
                  </td>
                }
                @if (columnVisible('method')) {
                  <td>{{ label(tx.method) }}</td>
                }
                @if (columnVisible('gateway')) {
                  <td>
                    <span class="tag">{{ tx.gateway }}</span>
                  </td>
                }
                @if (columnVisible('fee')) {
                  <td class="numeric">{{ tx.fee | currency }}</td>
                }
                @if (columnVisible('net')) {
                  <td class="numeric">
                    <strong>{{ tx.amount - tx.fee | currency: tx.currency }}</strong>
                  </td>
                }
                @if (columnVisible('country')) {
                  <td>{{ tx.country }}</td>
                }
                @if (columnVisible('createdAt')) {
                  <td>
                    <span>{{ tx.createdAt | date: 'MMM dd, y' }}</span
                    ><small>{{ tx.createdAt | date: 'HH:mm:ss' }}</small>
                  </td>
                }
                @if (columnVisible('riskScore')) {
                  <td>
                    <span class="risk" [attr.data-risk]="riskLevel(tx.riskScore)">{{
                      tx.riskScore
                    }}</span>
                  </td>
                }
                <td>
                  <details class="transaction-row-menu">
                    <summary [attr.aria-label]="'Actions for ' + tx.reference">...</summary>
                    <div>
                      <strong>Actions</strong
                      ><button type="button" (click)="copy(tx.id, 'Transaction ID')">
                        Copy Transaction ID</button
                      ><button type="button" (click)="copy(tx.reference, 'Reference')">
                        Copy Reference
                      </button>
                      <hr />
                      <button type="button" (click)="openDetails(tx)">View Details</button>
                      @if (tx.status === 'completed') {
                        <button type="button" (click)="openRefund(tx)">Process Refund</button>
                      }
                    </div>
                  </details>
                </td>
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="visibleColumnCount()" class="empty-state">
                  No transactions found.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="table-footer transaction-footer">
        <span>{{ selectedRows().size }} of {{ filtered().length }} row(s) selected.</span>
        <div>
          <label
            >Rows per page
            <select
              #pageSizeSelect
              [value]="pageSize()"
              (change)="pageSize.set(+pageSizeSelect.value); page.set(1)"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select></label
          ><span>Page {{ page() }} of {{ pageCount() }}</span
          ><button
            hlmBtn
            variant="outline"
            size="sm"
            type="button"
            aria-label="Previous page"
            [disabled]="page() === 1"
            (click)="page.update((value) => value - 1)"
          >
            &#8249;</button
          ><button
            hlmBtn
            variant="outline"
            size="sm"
            type="button"
            aria-label="Next page"
            [disabled]="page() === pageCount()"
            (click)="page.update((value) => value + 1)"
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>

    @if (selectedTransaction(); as tx) {
      <div class="modal-backdrop">
        <section
          class="form-dialog transaction-detail-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="transaction-detail-title">Transaction details</h2>
              <p>{{ tx.reference }}</p>
            </div>
            <button type="button" aria-label="Close" (click)="selectedTransactionId.set('')">
              &times;
            </button>
          </div>
          <div class="transaction-detail-grid">
            <span
              >Customer<b>{{ tx.customer }}</b
              ><small>{{ tx.email }}</small></span
            ><span
              >Amount<b>{{ tx.amount | currency: tx.currency }}</b
              ><small>Net {{ tx.amount - tx.fee | currency: tx.currency }}</small></span
            ><span
              >Status<b
                ><i class="status-pill" [attr.data-status]="tx.status">{{ tx.status }}</i></b
              ></span
            ><span
              >Payment method<b>{{ label(tx.method) }}</b
              ><small>{{ tx.gateway }}</small></span
            ><span
              >Country<b>{{ tx.country }}</b></span
            ><span
              >Created<b>{{ tx.createdAt | date: 'medium' }}</b></span
            ><span
              >Fee<b>{{ tx.fee | currency }}</b></span
            ><span
              >Risk score<b
                ><i class="risk" [attr.data-risk]="riskLevel(tx.riskScore)">{{
                  tx.riskScore
                }}</i></b
              ></span
            >
          </div>
          <div class="transaction-description">
            <small>Description</small>
            <p>{{ tx.description }}</p>
          </div>
          <div class="dialog-actions">
            <button
              hlmBtn
              variant="outline"
              type="button"
              (click)="copy(tx.reference, 'Reference')"
            >
              Copy reference</button
            ><span></span>
            @if (tx.status === 'completed') {
              <button hlmBtn type="button" (click)="openRefund(tx)">Process refund</button>
            }
            <button hlmBtn variant="outline" type="button" (click)="selectedTransactionId.set('')">
              Close
            </button>
          </div>
        </section>
      </div>
    }
    @if (refundTransaction(); as tx) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="refund-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="refund-title">Process refund</h2>
              <p>Refund {{ tx.amount | currency: tx.currency }} to {{ tx.customer }}?</p>
            </div>
            <button type="button" aria-label="Close" (click)="refundTransactionId.set('')">
              &times;
            </button>
          </div>
          <p>This updates the transaction status immediately in the dogfood backend.</p>
          <div class="dialog-actions">
            <button hlmBtn variant="outline" type="button" (click)="refundTransactionId.set('')">
              Cancel</button
            ><button hlmBtn variant="destructive" type="button" (click)="confirmRefund()">
              Confirm refund
            </button>
          </div>
        </section>
      </div>
    }
    @if (notice()) {
      <div class="toast" role="status">&#10003; {{ notice() }}</div>
    } @else if (store.notice()) {
      <div class="toast" role="status">&#10003; {{ store.notice() }}</div>
    }
  `,
})
export class TransactionsPage {
  readonly store = inject(AdminStore);
  readonly query = signal('');
  readonly status = signal('all');
  readonly method = signal('all');
  readonly gateway = signal('all');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedRows = signal(new Set<string>());
  readonly selectedTransactionId = signal('');
  readonly refundTransactionId = signal('');
  readonly notice = signal('');
  readonly statuses = ['completed', 'processing', 'pending', 'failed', 'refunded', 'disputed'];
  readonly methods = [
    'credit_card',
    'debit_card',
    'bank_transfer',
    'digital_wallet',
    'crypto',
    'ach',
  ];
  readonly gateways = ['stripe', 'paypal', 'square', 'adyen', 'braintree'];
  readonly columns: { key: ColumnKey; label: string }[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'method', label: 'Method' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'fee', label: 'Fee' },
    { key: 'net', label: 'Net' },
    { key: 'country', label: 'Country' },
    { key: 'createdAt', label: 'Date' },
    { key: 'riskScore', label: 'Risk Score' },
  ];
  readonly visibleColumns = signal(
    new Set<ColumnKey>([
      'reference',
      'customer',
      'amount',
      'status',
      'method',
      'gateway',
      'net',
      'createdAt',
      'riskScore',
    ]),
  );
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    const values = this.store
      .transactions()
      .filter(
        (transaction) =>
          (this.status() === 'all' || transaction.status === this.status()) &&
          (this.method() === 'all' || transaction.method === this.method()) &&
          (this.gateway() === 'all' || transaction.gateway === this.gateway()) &&
          (!query ||
            `${transaction.reference} ${transaction.customer} ${transaction.email} ${transaction.description}`
              .toLowerCase()
              .includes(query)),
      );
    const key = this.sortKey();
    if (!key) return values;
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...values].sort((left, right) => {
      const a = left[key];
      const b = right[key];
      return (
        (typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b))) * direction
      );
    });
  });
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );
  readonly paged = computed(() =>
    this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()),
  );
  readonly completionRate = computed(() =>
    this.store.transactions().length
      ? Math.round((this.statusCount('completed') / this.store.transactions().length) * 1000) / 10
      : 0,
  );
  readonly selectedTransaction = computed(() =>
    this.store
      .transactions()
      .find((transaction) => transaction.id === this.selectedTransactionId()),
  );
  readonly refundTransaction = computed(() =>
    this.store.transactions().find((transaction) => transaction.id === this.refundTransactionId()),
  );
  readonly allPageSelected = computed(
    () =>
      this.paged().length > 0 &&
      this.paged().every((transaction) => this.selectedRows().has(transaction.id)),
  );
  readonly filtersActive = computed(
    () =>
      Boolean(this.query()) ||
      this.status() !== 'all' ||
      this.method() !== 'all' ||
      this.gateway() !== 'all',
  );
  readonly visibleColumnCount = computed(() => this.visibleColumns().size + 2);

  constructor() {
    void this.store.loadTransactions();
  }

  statusCount(status: string): number {
    return this.store.transactions().filter((transaction) => transaction.status === status).length;
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
  label(value: string): string {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
  riskLevel(score: number): string {
    return score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low';
  }
  columnVisible(key: ColumnKey): boolean {
    return this.visibleColumns().has(key);
  }
  toggleColumn(key: ColumnKey): void {
    this.visibleColumns.update((columns) => {
      const next = new Set(columns);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  sortBy(key: SortKey): void {
    if (this.sortKey() === key)
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
  }
  sortIndicator(key: SortKey): string {
    return this.sortKey() === key
      ? this.sortDirection() === 'asc'
        ? '\u2191'
        : '\u2193'
      : '\u2195';
  }
  toggleRow(id: string): void {
    this.selectedRows.update((rows) => {
      const next = new Set(rows);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  togglePageSelection(): void {
    const ids = this.paged().map((transaction) => transaction.id);
    this.selectedRows.update((rows) => {
      const next = new Set(rows);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }
  resetFilters(): void {
    this.query.set('');
    this.status.set('all');
    this.method.set('all');
    this.gateway.set('all');
    this.page.set(1);
  }
  openDetails(transaction: Transaction): void {
    this.selectedTransactionId.set(transaction.id);
  }
  openRefund(transaction: Transaction): void {
    this.selectedTransactionId.set('');
    this.refundTransactionId.set(transaction.id);
  }
  async confirmRefund(): Promise<void> {
    const transaction = this.refundTransaction();
    if (!transaction) return;
    if (await this.store.updateTransaction(transaction.id, 'refunded'))
      this.refundTransactionId.set('');
  }
  async copy(value: string, label: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    this.flash(`${label} copied`);
  }
  exportJSON(): void {
    const blob = new Blob([JSON.stringify(this.filtered(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'transactions.json';
    anchor.click();
    URL.revokeObjectURL(url);
    this.flash('JSON export created');
  }
  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2500);
  }
}
