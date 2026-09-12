import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { AdminStore } from '../../core/admin.store';
import { KanbanTask } from '../../core/models';

interface Column {
  id: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-kanban',
  imports: [HlmButton, HlmInput, HlmTextarea],
  template: `
    <section class="page-heading">
      <div>
        <h1>Kanban board</h1>
        <p>Plan work visually and move cards as priorities change.</p>
      </div>
      <button hlmBtn type="button" (click)="openEditor()">＋ Add task</button>
    </section>
    <div class="kanban-board">
      @for (column of columns; track column.id) {
        <section
          class="kanban-column"
          (dragover)="allowDrop($event)"
          (drop)="drop($event, column.id)"
        >
          <header>
            <span
              ><i [style.background]="column.color"></i>{{ column.title
              }}<b>{{ tasksFor(column.id).length }}</b></span
            ><button
              type="button"
              [attr.aria-label]="'Add task to ' + column.title"
              (click)="openEditor(undefined, column.id)"
            >
              ＋
            </button>
          </header>
          <div class="kanban-stack">
            @for (task of tasksFor(column.id); track task.id) {
              <article
                class="kanban-card"
                draggable="true"
                (dragstart)="startDrag(task.id)"
                [class.dragging]="draggingId() === task.id"
              >
                <div class="card-label-row">
                  <span class="priority" [attr.data-priority]="task.priority">{{
                    task.priority
                  }}</span
                  ><button type="button" aria-label="Edit task" (click)="openEditor(task)">
                    •••
                  </button>
                </div>
                <h2>{{ task.title }}</h2>
                <p>{{ task.description }}</p>
                <footer>
                  <span class="avatar">{{ initials(task.assignee) }}</span
                  ><span>{{ task.assignee }}</span
                  ><button type="button" aria-label="Delete task" (click)="remove(task)">×</button>
                </footer>
              </article>
            } @empty {
              <div class="kanban-empty">
                <span>＋</span>
                <p>Drop tasks here</p>
              </div>
            }
          </div>
        </section>
      }
    </div>
    @if (editorOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kanban-dialog-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="kanban-dialog-title">{{ draftId() ? 'Edit card' : 'Add card' }}</h2>
              <p>Capture the task, owner, and priority.</p>
            </div>
            <button type="button" aria-label="Close" (click)="editorOpen.set(false)">×</button>
          </div>
          <form (submit)="save($event)">
            <label for="kanban-title">Title</label
            ><input
              hlmInput
              id="kanban-title"
              #titleInput
              [value]="draftTitle()"
              (input)="draftTitle.set(titleInput.value)"
            /><label for="kanban-description">Description</label
            ><textarea
              hlmTextarea
              id="kanban-description"
              #descriptionInput
              [value]="draftDescription()"
              (input)="draftDescription.set(descriptionInput.value)"
            ></textarea
            ><label for="kanban-assignee">Assignee</label
            ><input
              hlmInput
              id="kanban-assignee"
              #assigneeInput
              [value]="draftAssignee()"
              (input)="draftAssignee.set(assigneeInput.value)"
            />
            <div class="form-row">
              <div>
                <label for="kanban-status">Column</label
                ><select
                  id="kanban-status"
                  #statusInput
                  [value]="draftStatus()"
                  (change)="draftStatus.set(statusInput.value)"
                >
                  @for (column of columns; track column.id) {
                    <option [value]="column.id">{{ column.title }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="kanban-priority">Priority</label
                ><select
                  id="kanban-priority"
                  #priorityInput
                  [value]="draftPriority()"
                  (change)="draftPriority.set(priorityInput.value)"
                >
                  <option>high</option>
                  <option>medium</option>
                  <option>low</option>
                </select>
              </div>
            </div>
            <div class="dialog-actions">
              <button hlmBtn variant="outline" type="button" (click)="editorOpen.set(false)">
                Cancel</button
              ><button hlmBtn type="submit" [disabled]="!draftTitle().trim()">Save card</button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class KanbanPage {
  readonly store = inject(AdminStore);
  readonly columns: Column[] = [
    { id: 'todo', title: 'To do', color: '#64748b' },
    { id: 'in_progress', title: 'In progress', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#22c55e' },
  ];
  readonly draggingId = signal('');
  readonly editorOpen = signal(false);
  readonly draftId = signal('');
  readonly draftTitle = signal('');
  readonly draftDescription = signal('');
  readonly draftAssignee = signal('');
  readonly draftPriority = signal('medium');
  readonly draftStatus = signal('todo');
  constructor() {
    void this.store.loadKanban();
  }
  tasksFor(status: string): KanbanTask[] {
    return this.store.kanban().filter((task) => task.status === status);
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2);
  }
  startDrag(id: string): void {
    this.draggingId.set(id);
  }
  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }
  async drop(event: DragEvent, status: string): Promise<void> {
    event.preventDefault();
    const task = this.store.kanban().find((item) => item.id === this.draggingId());
    this.draggingId.set('');
    if (task && task.status !== status) await this.store.saveKanban({ ...task, status });
  }
  openEditor(task?: KanbanTask, status = 'todo'): void {
    this.draftId.set(task?.id ?? '');
    this.draftTitle.set(task?.title ?? '');
    this.draftDescription.set(task?.description ?? '');
    this.draftAssignee.set(task?.assignee ?? 'Unassigned');
    this.draftPriority.set(task?.priority ?? 'medium');
    this.draftStatus.set(task?.status ?? status);
    this.editorOpen.set(true);
  }
  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (
      await this.store.saveKanban({
        id: this.draftId(),
        title: this.draftTitle(),
        description: this.draftDescription(),
        assignee: this.draftAssignee(),
        priority: this.draftPriority(),
        status: this.draftStatus(),
      })
    )
      this.editorOpen.set(false);
  }
  async remove(task: KanbanTask): Promise<void> {
    if (confirm(`Delete “${task.title}”?`)) await this.store.deleteKanban(task.id);
  }
}
