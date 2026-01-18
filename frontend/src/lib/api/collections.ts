import { ClientApiClient } from './client';
import {
  Collection,
  CollectionSchema,
  CreateCollectionRequest,
  CreateCollectionRequestSchema,
  UpdateCollectionRequest,
  UpdateCollectionRequestSchema,
} from '../types/collection';

export class CollectionsApi {
  constructor(private client: ClientApiClient) { }

  async list(): Promise<Collection[]> {
    const response = await this.client.get<unknown>('/api/collections');
    if (!Array.isArray(response)) {
      throw new Error('Invalid response: expected array');
    }
    return response.map(item => CollectionSchema.parse(item));
  }

  async create(data: CreateCollectionRequest): Promise<Collection> {
    CreateCollectionRequestSchema.parse(data);
    const response = await this.client.post<unknown>('/api/collections', data);
    return CollectionSchema.parse(response);
  }

  async update(id: string, data: UpdateCollectionRequest): Promise<Collection> {
    UpdateCollectionRequestSchema.parse(data);
    const response = await this.client.patch<unknown>(`/api/collections/${id}`, data);
    return CollectionSchema.parse(response);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete<void>(`/api/collections/${id}`);
  }
}

export const createClientCollectionsApi = (token: string): CollectionsApi => {
  return new CollectionsApi(new ClientApiClient(token));
};
