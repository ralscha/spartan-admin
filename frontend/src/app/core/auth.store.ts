import { computed, inject, Service, signal } from '@angular/core';
import { ApiError, ApiService } from './api.service';
import { AdminStore } from './admin.store';
import { User } from './models';

@Service()
export class AuthStore {
  private readonly api = inject(ApiService);
  private readonly admin = inject(AdminStore);
  private restorePromise: Promise<boolean> | undefined;
  readonly user = signal<User | null>(null);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly authenticated = computed(() => this.user() !== null);
  restore(force = false): Promise<boolean> {
    if (force) this.restorePromise = undefined;
    this.restorePromise ??= this.api
      .get<User>('/auth/session')
      .then((user) => {
        this.user.set(user);
        return true;
      })
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error(error);
          this.restorePromise = undefined;
        }
        this.user.set(null);
        this.admin.clear();
        return false;
      });
    return this.restorePromise;
  }
  refresh(): Promise<boolean> {
    return this.restore(true);
  }
  async signIn(email: string, password: string): Promise<boolean> {
    return this.authenticate('/auth/sign-in', { email, password });
  }
  async signUp(name: string, email: string, password: string): Promise<boolean> {
    return this.authenticate('/auth/sign-up', { name, email, password });
  }
  async resetPassword(email: string): Promise<string> {
    this.pending.set(true);
    this.error.set('');
    try {
      return (await this.api.post<{ message: string }>('/auth/reset-password', { email })).message;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to reset password');
      return '';
    } finally {
      this.pending.set(false);
    }
  }
  async signOut(): Promise<void> {
    try {
      await this.api.post<void>('/auth/sign-out');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign out');
    } finally {
      this.user.set(null);
      this.restorePromise = undefined;
      this.admin.clear();
    }
  }
  private async authenticate(path: string, body: object): Promise<boolean> {
    this.pending.set(true);
    this.error.set('');
    try {
      this.admin.clear();
      this.user.set(await this.api.post<User>(path, body));
      this.restorePromise = Promise.resolve(true);
      return true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Authentication failed');
      return false;
    } finally {
      this.pending.set(false);
    }
  }
}
