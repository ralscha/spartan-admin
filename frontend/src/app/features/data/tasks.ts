import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AdminStore } from '../../core/admin.store';
import { csvCell, downloadTextFile } from '../../core/download';
import { Task } from '../../core/models';

@Component({
  selector: 'app-tasks',
  imports: [HlmButton, HlmInput],
  template: `
    <section class="page-heading">
      <div>
        <h1>Tasks</h1>
        <p>Track, filter, and manage work across your team.</p>
      </div>
      <button hlmBtn type="button" (click)="openEditor()">＋ Add task</button>
    </section>
    <section class="panel data-panel">
      <div class="table-toolbar">
        <div class="search-field">
          <span>⌕</span
          ><input
            hlmInput
            #searchInput
            aria-label="Search tasks"
            placeholder="Filter tasks..."
            [value]="query()"
            (input)="query.set(searchInput.value); page.set(1)"
          />
        </div>
        <select
          #statusSelect
          aria-label="Filter task status"
          [value]="status()"
          (change)="status.set(statusSelect.value); page.set(1)"
        >
          <option value="all">All statuses</option>
          <option value="backlog">Backlog</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option></select
        ><select
          #prioritySelect
          aria-label="Filter priority"
          [value]="priority()"
          (change)="priority.set(prioritySelect.value); page.set(1)"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option></select
        ><button hlmBtn variant="outline" type="button" (click)="exportCsv()">⇩ Export</button>
      </div>
      @if (selected().size) {
        <div class="bulk-bar">
          <span>{{ selected().size }} selected</span
          ><button type="button" (click)="bulkDone()">Mark complete</button
          ><button type="button" (click)="bulkDelete()">Delete</button>
        </div>
      }
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select visible tasks"
                  [checked]="allSelected()"
                  (change)="toggleAll()"
                />
              </th>
              <th>Task</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Label</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (task of paged(); track task.id) {
              <tr>
                <td>
                  <input
                    type="checkbox"
                    [attr.aria-label]="'Select ' + task.title"
                    [checked]="selected().has(task.id)"
                    (change)="toggle(task.id)"
                  />
                </td>
                <td>
                  <div class="task-title">
                    <span>{{ task.id.slice(-4).toUpperCase() }}</span
                    ><strong>{{ task.title }}</strong>
                  </div>
                </td>
                <td>
                  <span class="status-pill" [attr.data-status]="task.status"
                    ><i></i>{{ label(task.status) }}</span
                  >
                </td>
                <td>
                  <span class="priority" [attr.data-priority]="task.priority"
                    >{{ priorityIcon(task.priority) }} {{ task.priority }}</span
                  >
                </td>
                <td>
                  <span class="tag">{{ task.label }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" aria-label="Edit task" (click)="openEditor(task)">
                      ✎</button
                    ><button type="button" aria-label="Delete task" (click)="remove(task)">
                      ⋯
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty-state">No tasks match the current filters.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span>{{ filtered().length }} task(s)</span>
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
          aria-labelledby="task-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="task-dialog-title">{{ draftId() ? 'Edit task' : 'Add task' }}</h2>
              <p>Define the work and how it should be tracked.</p>
            </div>
            <button type="button" aria-label="Close" (click)="editorOpen.set(false)">×</button>
          </div>
          <form (submit)="save($event)">
            <label for="task-title">Task title</label
            ><input
              hlmInput
              id="task-title"
              #titleInput
              [value]="draftTitle()"
              (input)="draftTitle.set(titleInput.value)"
            />
            <div class="form-row">
              <div>
                <label for="task-status">Status</label
                ><select
                  id="task-status"
                  #stateInput
                  [value]="draftStatus()"
                  (change)="draftStatus.set(stateInput.value)"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label for="task-priority">Priority</label
                ><select
                  id="task-priority"
                  #prioInput
                  [value]="draftPriority()"
                  (change)="draftPriority.set(prioInput.value)"
                >
                  <option>high</option>
                  <option>medium</option>
                  <option>low</option>
                </select>
              </div>
            </div>
            <label for="task-label">Label</label
            ><select
              id="task-label"
              #labelInput
              [value]="draftLabel()"
              (change)="draftLabel.set(labelInput.value)"
            >
              <option>feature</option>
              <option>bug</option>
              <option>documentation</option>
            </select>
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="editorOpen.set(false)">
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!draftTitle().trim()">Save task</button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class TasksPage {
  readonly store = inject(AdminStore);
  readonly query = signal('');
  readonly status = signal('all');
  readonly priority = signal('all');
  readonly page = signal(1);
  readonly pageSize = 7;
  readonly selected = signal(new Set<string>());
  readonly editorOpen = signal(false);
  readonly draftId = signal('');
  readonly draftTitle = signal('');
  readonly draftStatus = signal('todo');
  readonly draftPriority = signal('medium');
  readonly draftLabel = signal('feature');
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.store
      .tasks()
      .filter(
        (t) =>
          (this.status() === 'all' || t.status === this.status()) &&
          (this.priority() === 'all' || t.priority === this.priority()) &&
          t.title.toLowerCase().includes(q),
      );
  });
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
  readonly paged = computed(() =>
    this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );
  readonly allSelected = computed(
    () => this.paged().length > 0 && this.paged().every((t) => this.selected().has(t.id)),
  );
  constructor() {
    void this.store.loadTasks();
  }
  label(value: string): string {
    return value.replace('_', ' ');
  }
  priorityIcon(value: string): string {
    return value === 'high' ? '↑' : value === 'low' ? '↓' : '→';
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
    const ids = this.paged().map((t) => t.id);
    this.selected.update((items) => {
      const next = new Set(items);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }
  openEditor(task?: Task): void {
    this.draftId.set(task?.id ?? '');
    this.draftTitle.set(task?.title ?? '');
    this.draftStatus.set(task?.status ?? 'todo');
    this.draftPriority.set(task?.priority ?? 'medium');
    this.draftLabel.set(task?.label ?? 'feature');
    this.editorOpen.set(true);
  }
  async save(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.store.tasks().find((t) => t.id === this.draftId());
    const saved = await this.store.saveTask({
      id: this.draftId(),
      title: this.draftTitle(),
      status: this.draftStatus(),
      priority: this.draftPriority(),
      label: this.draftLabel(),
      createdAt: current?.createdAt ?? new Date().toISOString(),
    });
    if (saved) this.editorOpen.set(false);
  }
  async remove(task: Task): Promise<void> {
    if (confirm(`Delete “${task.title}”?`)) await this.store.deleteTask(task.id);
  }
  async bulkDone(): Promise<void> {
    const completed: string[] = [];
    for (const task of this.store.tasks().filter((t) => this.selected().has(t.id)))
      if (await this.store.saveTask({ ...task, status: 'done' })) completed.push(task.id);
    this.selected.update((items) => new Set([...items].filter((id) => !completed.includes(id))));
  }
  async bulkDelete(): Promise<void> {
    if (!confirm(`Delete ${this.selected().size} tasks?`)) return;
    const deleted: string[] = [];
    for (const id of this.selected()) if (await this.store.deleteTask(id)) deleted.push(id);
    this.selected.update((items) => new Set([...items].filter((id) => !deleted.includes(id))));
  }
  exportCsv(): void {
    const content =
      'title,status,priority,label\n' +
      this.filtered()
        .map((t) => [t.title, t.status, t.priority, t.label].map(csvCell).join(','))
        .join('\n');
    downloadTextFile('tasks.csv', content);
  }
}
