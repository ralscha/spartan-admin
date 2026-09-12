import { computed, inject, Service, signal, WritableSignal } from '@angular/core';
import { ApiService } from './api.service';
import {
  AiReply,
  CalendarEvent,
  Conversation,
  KanbanTask,
  Mail,
  Message,
  Settings,
  Task,
  Transaction,
  User,
} from './models';

type OperationResult<T> = { ok: true; value: T } | { ok: false };

@Service()
export class AdminStore {
  private readonly api = inject(ApiService);
  private readonly pendingOperations = signal(0);
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  readonly loading = computed(() => this.pendingOperations() > 0);
  readonly error = signal('');
  readonly notice = signal('');
  readonly users = signal<User[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly kanban = signal<KanbanTask[]>([]);
  readonly events = signal<CalendarEvent[]>([]);
  readonly mails = signal<Mail[]>([]);
  readonly conversations = signal<Conversation[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly settings = signal<Settings | null>(null);

  loadUsers(): Promise<boolean> {
    return this.loadInto(this.users, () => this.api.get<User[]>('/users'));
  }
  loadTasks(): Promise<boolean> {
    return this.loadInto(this.tasks, () => this.api.get<Task[]>('/tasks'));
  }
  loadKanban(): Promise<boolean> {
    return this.loadInto(this.kanban, () => this.api.get<KanbanTask[]>('/kanban'));
  }
  loadEvents(): Promise<boolean> {
    return this.loadInto(this.events, () => this.api.get<CalendarEvent[]>('/calendar/events'));
  }
  loadMails(): Promise<boolean> {
    return this.loadInto(this.mails, () => this.api.get<Mail[]>('/mail'));
  }
  loadChats(): Promise<boolean> {
    return this.loadInto(this.conversations, () => this.api.get<Conversation[]>('/chats'));
  }
  loadTransactions(): Promise<boolean> {
    return this.loadInto(this.transactions, () => this.api.get<Transaction[]>('/transactions'));
  }
  loadSettings(): Promise<boolean> {
    return this.loadInto(this.settings, () => this.api.get<Settings>('/settings'));
  }

  saveUser(user: User): Promise<boolean> {
    return this.saveEntity(
      this.users,
      () =>
        user.id
          ? this.api.put<User>(`/users/${user.id}`, user)
          : this.api.post<User>('/users', user),
      'User saved',
    );
  }

  deleteUser(id: string): Promise<boolean> {
    return this.mutate(
      () => this.api.delete(`/users/${id}`),
      () => this.users.update((items) => items.filter((item) => item.id !== id)),
      'User removed',
    );
  }

  saveTask(task: Task): Promise<boolean> {
    return this.saveEntity(
      this.tasks,
      () =>
        task.id
          ? this.api.put<Task>(`/tasks/${task.id}`, task)
          : this.api.post<Task>('/tasks', task),
      'Task saved',
    );
  }

  deleteTask(id: string): Promise<boolean> {
    return this.mutate(
      () => this.api.delete(`/tasks/${id}`),
      () => this.tasks.update((items) => items.filter((item) => item.id !== id)),
      'Task removed',
    );
  }

  saveKanban(task: KanbanTask): Promise<boolean> {
    return this.saveEntity(this.kanban, () =>
      task.id
        ? this.api.put<KanbanTask>(`/kanban/${task.id}`, task)
        : this.api.post<KanbanTask>('/kanban', task),
    );
  }

  deleteKanban(id: string): Promise<boolean> {
    return this.mutate(
      () => this.api.delete(`/kanban/${id}`),
      () => this.kanban.update((items) => items.filter((item) => item.id !== id)),
    );
  }

  saveEvent(event: CalendarEvent): Promise<boolean> {
    return this.saveEntity(
      this.events,
      () =>
        event.id
          ? this.api.put<CalendarEvent>(`/calendar/events/${event.id}`, event)
          : this.api.post<CalendarEvent>('/calendar/events', event),
      'Event saved',
    );
  }

  deleteEvent(id: string): Promise<boolean> {
    return this.mutate(
      () => this.api.delete(`/calendar/events/${id}`),
      () => this.events.update((items) => items.filter((item) => item.id !== id)),
      'Event removed',
    );
  }

  updateMail(id: string, changes: Partial<Pick<Mail, 'read' | 'folder'>>): Promise<boolean> {
    return this.saveEntity(this.mails, () => this.api.patch<Mail>(`/mail/${id}`, changes));
  }

  markMail(id: string, read: boolean): Promise<boolean> {
    return this.updateMail(id, { read });
  }

  moveMail(id: string, folder: string): Promise<boolean> {
    return this.saveEntity(
      this.mails,
      () => this.api.patch<Mail>(`/mail/${id}`, { folder }),
      `Message moved to ${folder}`,
    );
  }

  sendMail(to: string, subject: string, body: string): Promise<boolean> {
    return this.saveEntity(
      this.mails,
      () => this.api.post<Mail>('/mail', { to, subject, body }),
      'Message sent',
    );
  }

  updateTransaction(id: string, status: string): Promise<boolean> {
    return this.saveEntity(
      this.transactions,
      () => this.api.patch<Transaction>(`/transactions/${id}`, { status }),
      `Transaction marked ${status}`,
    );
  }

  async addMessage(conversationId: string, text: string): Promise<boolean> {
    const result = await this.execute(() =>
      this.api.post<Message>(`/chats/${conversationId}/messages`, { text }),
    );
    if (!result.ok) return false;
    this.conversations.update((items) =>
      items.map((item) =>
        item.id === conversationId
          ? { ...item, unread: 0, messages: [...item.messages, result.value] }
          : item,
      ),
    );
    return true;
  }

  markConversationRead(conversationId: string): void {
    this.conversations.update((items) =>
      items.map((item) => (item.id === conversationId ? { ...item, unread: 0 } : item)),
    );
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    const result = await this.execute(() => this.api.put<Settings>('/settings', settings));
    if (!result.ok) return false;
    this.settings.set(result.value);
    this.flash('Settings saved');
    return true;
  }

  async askAi(prompt: string, model: string): Promise<string | null> {
    const result = await this.execute(() => this.api.post<AiReply>('/ai/chat', { prompt, model }));
    return result.ok ? result.value.reply : null;
  }

  clearError(): void {
    this.error.set('');
  }

  clear(): void {
    this.pendingOperations.set(0);
    this.error.set('');
    this.notice.set('');
    this.users.set([]);
    this.tasks.set([]);
    this.kanban.set([]);
    this.events.set([]);
    this.mails.set([]);
    this.conversations.set([]);
    this.transactions.set([]);
    this.settings.set(null);
  }

  private async loadInto<T>(
    target: WritableSignal<T>,
    operation: () => Promise<T>,
  ): Promise<boolean> {
    const result = await this.execute(operation);
    if (!result.ok) return false;
    target.set(result.value);
    return true;
  }

  private async saveEntity<T extends { id: string }>(
    target: WritableSignal<T[]>,
    operation: () => Promise<T>,
    notice?: string,
  ): Promise<boolean> {
    const result = await this.execute(operation);
    if (!result.ok) return false;
    target.update((items) => this.upsert(items, result.value));
    if (notice) this.flash(notice);
    return true;
  }

  private async mutate(
    operation: () => Promise<void>,
    commit: () => void,
    notice?: string,
  ): Promise<boolean> {
    const result = await this.execute(operation);
    if (!result.ok) return false;
    commit();
    if (notice) this.flash(notice);
    return true;
  }

  private async execute<T>(operation: () => Promise<T>): Promise<OperationResult<T>> {
    this.pendingOperations.update((count) => count + 1);
    this.error.set('');
    try {
      return { ok: true, value: await operation() };
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Request failed');
      return { ok: false };
    } finally {
      this.pendingOperations.update((count) => Math.max(0, count - 1));
    }
  }

  private upsert<T extends { id: string }>(items: T[], saved: T): T[] {
    return items.some((item) => item.id === saved.id)
      ? items.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...items];
  }

  private flash(message: string): void {
    if (this.noticeTimer !== undefined) clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => {
      this.notice.set('');
      this.noticeTimer = undefined;
    }, 2_500);
  }
}
