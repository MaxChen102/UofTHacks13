import { ApiError, AuthenticationError, NotFoundError, ValidationError } from '../errors/api-errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ClientApiClient {
  private readonly baseURL: string;
  private readonly token: string;

  constructor(token: string, baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private handleError(statusCode: number, responseText: string): never {
    let details;
    try {
      details = JSON.parse(responseText);
    } catch {
      details = responseText;
    }

    switch (statusCode) {
      case 401:
        throw new AuthenticationError(undefined, details);
      case 404:
        throw new NotFoundError(undefined, details);
      case 422:
        throw new ValidationError(undefined, details);
      default:
        throw new ApiError(statusCode, `Request failed with status ${statusCode}`, details);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const isNgrok =
      this.baseURL.includes('.ngrok-free.dev') ||
      this.baseURL.includes('.ngrok.io') ||
      this.baseURL.includes('.ngrok.app');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();

    if (!response.ok) {
      this.handleError(response.status, responseText);
    }

    if (!responseText) {
      return undefined as T;
    }

    return JSON.parse(responseText) as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
