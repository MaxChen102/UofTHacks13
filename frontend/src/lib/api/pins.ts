import { ClientApiClient } from './client';
import {
  Pin,
  PinSchema,
  CreatePinRequest,
  CreatePinRequestSchema,
  UpdatePinRequest,
  UpdatePinRequestSchema,
  PinType,
  ProcessingStatus,
} from '../types/pin';

export class PinsApi {
  constructor(private client: ClientApiClient) { }

  async create(data: CreatePinRequest): Promise<Pin> {
    const validation = CreatePinRequestSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    const response = await this.client.post<unknown>('/api/pins', data);
    return parsePinResponse(response);
  }

  async get(id: string): Promise<Pin> {
    const response = await this.client.get<unknown>(`/api/pins/${id}`);
    return parsePinResponse(response);
  }

  async list(collectionId?: string): Promise<Pin[]> {
    const endpoint = collectionId
      ? `/api/pins?collection_id=${encodeURIComponent(collectionId)}`
      : '/api/pins';
    const response = await this.client.get<unknown>(endpoint);

    if (!Array.isArray(response)) {
      throw new Error('Invalid response: expected array');
    }

    return response.map(item => parsePinResponse(item));
  }

  async update(id: string, data: UpdatePinRequest): Promise<Pin> {
    const validation = UpdatePinRequestSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    const response = await this.client.patch<unknown>(`/api/pins/${id}`, data);
    return parsePinResponse(response);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete<void>(`/api/pins/${id}`);
  }
}

export const createClientPinsApi = (token: string): PinsApi => {
  return new PinsApi(new ClientApiClient(token));
};

const DEFAULT_STATUS: ProcessingStatus = 'processing';
const VALID_STATUSES: ProcessingStatus[] = ['pending', 'processing', 'complete', 'failed'];
const VALID_PIN_TYPES: PinType[] = ['restaurant', 'concert', 'sports', 'other'];

function parsePinResponse(response: unknown): Pin {
  try {
    const parsed = PinSchema.safeParse(response);
    if (parsed.success) {
      return parsed.data;
    }
  } catch (error) {
    if (!(error instanceof TypeError && error.message.includes('_zod'))) {
      throw error;
    }
  }

  return coercePin(response);
}

function coercePin(response: unknown): Pin {
  const raw = isRecord(response) ? response : {};
  const now = new Date().toISOString();

  return {
    id: coerceId(raw._id ?? raw.id) ?? '',
    user_id: coerceId(raw.user_id) ?? '',
    collection_id: coerceId(raw.collection_id) ?? undefined,
    pin_type: coercePinType(raw.pin_type),
    title: coerceString(raw.title) ?? 'Untitled',
    summary: coerceString(raw.summary) ?? '',
    ai_recommendation: coerceString(raw.ai_recommendation) ?? null,
    location: coerceLocation(raw.location),
    datetime: coerceString(raw.datetime) ?? null,
    source_images: coerceStringArray(raw.source_images),
    links: coerceLinks(raw.links),
    metadata: isRecord(raw.metadata) ? (raw.metadata as Record<string, unknown>) : null,
    processing_status: coerceStatus(raw.processing_status),
    created_at: coerceString(raw.created_at) ?? now,
    updated_at: coerceString(raw.updated_at) ?? now,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function coerceId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (isRecord(value) && typeof value.$oid === 'string') return value.$oid;
  if (value instanceof Date) return value.toISOString();
  return null;
}

function coerceString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  return null;
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function coerceStatus(value: unknown): ProcessingStatus {
  return VALID_STATUSES.includes(value as ProcessingStatus)
    ? (value as ProcessingStatus)
    : DEFAULT_STATUS;
}

function coercePinType(value: unknown): PinType {
  return VALID_PIN_TYPES.includes(value as PinType) ? (value as PinType) : 'other';
}

function coerceLocation(value: unknown): Pin['location'] {
  if (!isRecord(value)) return null;
  const address = coerceString(value.address) ?? undefined;
  const lat = typeof value.lat === 'number' ? value.lat : undefined;
  const lng = typeof value.lng === 'number' ? value.lng : undefined;
  const place_id = coerceString(value.place_id) ?? undefined;

  if (!address && typeof lat !== 'number' && typeof lng !== 'number' && !place_id) {
    return null;
  }

  return {
    address,
    lat,
    lng,
    place_id,
  };
}

function coerceLinks(value: unknown): Pin['links'] {
  if (!isRecord(value)) return null;
  const website = coerceString(value.website) ?? undefined;
  const tickets = coerceString(value.tickets) ?? undefined;
  const menu = coerceString(value.menu) ?? undefined;
  const reviews = coerceString(value.reviews) ?? undefined;

  if (!website && !tickets && !menu && !reviews) {
    return null;
  }

  return { website, tickets, menu, reviews };
}
