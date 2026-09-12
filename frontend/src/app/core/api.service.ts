import { Service } from '@angular/core';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

@Service()
export class ApiService {
  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }
  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
  async delete(path: string): Promise<void> {
    await this.request<void>(path, { method: 'DELETE' });
  }
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined && !headers.has('Content-Type'))
      headers.set('Content-Type', 'application/json');
    const response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({ error: response.statusText }))) as {
        error?: string;
      };
      throw new ApiError(body.error ?? 'Request failed', response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}
