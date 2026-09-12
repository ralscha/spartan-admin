import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AdminStore } from '../../core/admin.store';
import { csvCell, downloadTextFile } from '../../core/download';
import { User } from '../../core/models';

@Component({
  selector: 'app-users',
  imports: [DatePipe, HlmButton, HlmInput],
  template: `
    <section class="page-heading">
      <div>
        <h1>Users</h1>
        <p>Manage workspace members, their roles, and account status.</p>
      </div>
      <button hlmBtn type="button" (click)="openEditor()">＋ Add user</button>
    </section>
    <div class="state-card-grid">
      <article>
        <i class="blue">♙</i
        ><span
          ><small>Total users</small><strong>{{ store.users().length }}</strong></span
        ><b>+12%</b>
      </article>
      <article>
        <i class="green">✓</i
        ><span
          ><small>Active</small><strong>{{ activeCount() }}</strong></span
        ><b>+8%</b>
      </article>
      <article>
        <i class="amber">⌛</i
        ><span
          ><small>Invited</small><strong>{{ invitedCount() }}</strong></span
        ><b>Pending</b>
      </article>
      <article>
        <i class="red">⊘</i
        ><span
          ><small>Suspended</small><strong>{{ suspendedCount() }}</strong></span
        ><b>Review</b>
      </article>
    </div>
    <section class="panel data-panel">
      <div class="table-toolbar">
        <div class="search-field">
          <span>⌕</span
          ><input
            hlmInput
            #searchInput
            aria-label="Search users"
            placeholder="Filter users..."
            [value]="query()"
            (input)="query.set(searchInput.value); page.set(1)"
          />
        </div>
        <select
          #statusSelect
          aria-label="Filter by status"
          [value]="status()"
          (change)="status.set(statusSelect.value); page.set(1)"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option></select
        ><button hlmBtn variant="outline" type="button" (click)="exportCsv()">⇩ Export</button>
      </div>
      @if (store.loading()) {
        <div class="table-loading">Loading users…</div>
      } @else {
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select visible users"
                    [checked]="allSelected()"
                    (change)="toggleAll()"
                  />
                </th>
                <th>
                  <button type="button" (click)="sortBy('name')">
                    User {{ sortMark('name') }}
                  </button>
                </th>
                <th>
                  <button type="button" (click)="sortBy('role')">
                    Role {{ sortMark('role') }}
                  </button>
                </th>
                <th>Status</th>
                <th>Last active</th>
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (user of paged(); track user.id) {
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      [attr.aria-label]="'Select ' + user.name"
                      [checked]="selected().has(user.id)"
                      (change)="toggle(user.id)"
                    />
                  </td>
                  <td>
                    <div class="user-cell">
                      <span class="avatar">{{ initials(user.name) }}</span
                      ><span
                        ><strong>{{ user.name }}</strong
                        ><small>{{ user.email }}</small></span
                      >
                    </div>
                  </td>
                  <td>{{ user.role }}</td>
                  <td>
                    <span class="status-pill" [attr.data-status]="user.status"
                      ><i></i>{{ user.status }}</span
                    >
                  </td>
                  <td>{{ user.lastLogin | date: 'MMM d, y' }}</td>
                  <td>
                    <div class="row-actions">
                      <button type="button" aria-label="Edit user" (click)="openEditor(user)">
                        ✎</button
                      ><button type="button" aria-label="Delete user" (click)="remove(user)">
                        ⋯
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-state">No users match the current filters.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span>{{ selected().size }} of {{ filtered().length }} row(s) selected.</span>
          <div>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              [disabled]="page() === 1"
              (click)="page.update((p) => p - 1)"
            >
              Previous</button
            ><span>Page {{ page() }} of {{ pageCount() }}</span
            ><button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              [disabled]="page() === pageCount()"
              (click)="page.update((p) => p + 1)"
            >
              Next
            </button>
          </div>
        </div>
      }
    </section>
    @if (store.notice()) {
      <div class="toast" role="status">✓ {{ store.notice() }}</div>
    }
    @if (editorOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="user-dialog-title">{{ draftId() ? 'Edit user' : 'Add user' }}</h2>
              <p>
                {{
                  draftId()
                    ? 'Update this member’s account details.'
                    : 'Invite a new member to your workspace.'
                }}
              </p>
            </div>
            <button type="button" aria-label="Close" (click)="closeEditor()">×</button>
          </div>
          <form (submit)="save($event)">
            <label for="user-name">Name</label
            ><input
              hlmInput
              id="user-name"
              #nameInput
              [value]="draftName()"
              (input)="draftName.set(nameInput.value)"
              required
            /><label for="user-email">Email</label
            ><input
              hlmInput
              id="user-email"
              type="email"
              #emailInput
              [value]="draftEmail()"
              (input)="draftEmail.set(emailInput.value)"
              required
            />
            <div class="form-row">
              <div>
                <label for="user-role">Role</label
                ><select
                  id="user-role"
                  #roleInput
                  [value]="draftRole()"
                  (change)="draftRole.set(roleInput.value)"
                >
                  <option>Owner</option>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div>
                <label for="user-status">Status</label
                ><select
                  id="user-status"
                  #stateInput
                  [value]="draftStatus()"
                  (change)="draftStatus.set(stateInput.value)"
                >
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="closeEditor()">Cancel</button
              ><button
                hlmBtn
                type="submit"
                [disabled]="!draftName().trim() || !draftEmail().includes('@')"
              >
                Save user
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class UsersPage {
  readonly store = inject(AdminStore);
  readonly query = signal('');
  readonly status = signal('all');
  readonly page = signal(1);
  readonly pageSize = 5;
  readonly selected = signal(new Set<string>());
  readonly sortKey = signal<'name' | 'role'>('name');
  readonly sortAsc = signal(true);
  readonly editorOpen = signal(false);
  readonly draftId = signal('');
  readonly draftName = signal('');
  readonly draftEmail = signal('');
  readonly draftRole = signal('Viewer');
  readonly draftStatus = signal('active');
  readonly activeCount = computed(
    () => this.store.users().filter((u) => u.status === 'active').length,
  );
  readonly invitedCount = computed(
    () => this.store.users().filter((u) => u.status === 'invited').length,
  );
  readonly suspendedCount = computed(
    () => this.store.users().filter((u) => u.status === 'suspended').length,
  );
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return [
      ...this.store
        .users()
        .filter(
          (u) =>
            (this.status() === 'all' || u.status === this.status()) &&
            `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q),
        ),
    ].sort((a, b) => {
      const result = a[this.sortKey()].localeCompare(b[this.sortKey()]);
      return this.sortAsc() ? result : -result;
    });
  });
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
  readonly paged = computed(() =>
    this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );
  readonly allSelected = computed(
    () => this.paged().length > 0 && this.paged().every((u) => this.selected().has(u.id)),
  );
  constructor() {
    void this.store.loadUsers();
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
  }
  toggle(id: string): void {
    this.selected.update((items) => {
      const next = new Set(items);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  toggleAll(): void {
    const ids = this.paged().map((u) => u.id);
    this.selected.update((items) => {
      const next = new Set(items);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }
  sortBy(key: 'name' | 'role'): void {
    if (this.sortKey() === key) this.sortAsc.update((v) => !v);
    else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }
  sortMark(key: string): string {
    return this.sortKey() === key ? (this.sortAsc() ? '↑' : '↓') : '';
  }
  openEditor(user?: User): void {
    this.draftId.set(user?.id ?? '');
    this.draftName.set(user?.name ?? '');
    this.draftEmail.set(user?.email ?? '');
    this.draftRole.set(user?.role ?? 'Viewer');
    this.draftStatus.set(user?.status ?? 'active');
    this.editorOpen.set(true);
  }
  closeEditor(): void {
    this.editorOpen.set(false);
  }
  async save(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.store.users().find((u) => u.id === this.draftId());
    const saved = await this.store.saveUser({
      id: this.draftId(),
      name: this.draftName(),
      email: this.draftEmail(),
      role: this.draftRole(),
      status: this.draftStatus(),
      createdAt: current?.createdAt ?? new Date().toISOString(),
      lastLogin: current?.lastLogin ?? new Date().toISOString(),
    });
    if (saved) this.closeEditor();
  }
  async remove(user: User): Promise<void> {
    if (confirm(`Remove ${user.name}?`)) await this.store.deleteUser(user.id);
  }
  exportCsv(): void {
    downloadTextFile(
      'users.csv',
      'name,email,role,status\n' +
        this.filtered()
          .map((u) => [u.name, u.email, u.role, u.status].map(csvCell).join(','))
          .join('\n'),
    );
  }
}
