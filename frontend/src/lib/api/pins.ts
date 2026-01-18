import { ClientApiClient } from './client';
import { Pin, PinSchema, CreatePinRequest, CreatePinRequestSchema, UpdatePinRequest, UpdatePinRequestSchema } from '../types/pin';

export class PinsApi {
  constructor(private client: ClientApiClient) {}

  async create(data: CreatePinRequest): Promise<Pin> {
    CreatePinRequestSchema.parse(data);
    const response = await this.client.post<unknown>('/api/pins', data);
    return PinSchema.parse(response);
  }

  async get(id: string): Promise<Pin> {
    const response = await this.client.get<unknown>(`/api/pins/${id}`);
    return PinSchema.parse(response);
  }

  async list(collectionId?: string): Promise<Pin[]> {
    const endpoint = collectionId
      ? `/api/pins?collection_id=${encodeURIComponent(collectionId)}`
      : '/api/pins';
    const response = await this.client.get<unknown>(endpoint);

    if (!Array.isArray(response)) {
      throw new Error('Invalid response: expected array');
    }

    return response.map(item => PinSchema.parse(item));
  }

  async update(id: string, data: UpdatePinRequest): Promise<Pin> {
    UpdatePinRequestSchema.parse(data);
    const response = await this.client.patch<unknown>(`/api/pins/${id}`, data);
    return PinSchema.parse(response);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete<void>(`/api/pins/${id}`);
  }
}

export const createClientPinsApi = (token: string): PinsApi => {
  return new PinsApi(new ClientApiClient(token));
};
