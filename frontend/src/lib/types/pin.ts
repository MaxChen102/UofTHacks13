import { z } from 'zod';

export const ProcessingStatusSchema = z.enum(['pending', 'processing', 'complete', 'failed']);

export const LocationSchema = z.object({
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  place_id: z.string().optional(),
  google_maps_url: z.string().url().optional(),
});

export const LinksSchema = z.object({
  website: z.string().url().optional(),
  tickets: z.string().url().optional(),
  menu: z.string().url().optional(),
  reviews: z.string().url().optional(),
});

export const PinTypeSchema = z.enum(['restaurant', 'concert', 'sports', 'other']);

export const PinSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  collection_id: z.string().optional().nullable(),
  pin_type: PinTypeSchema.nullable(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  ai_recommendation: z.string().optional().nullable(),
  location: LocationSchema.optional().nullable(),
  datetime: z.string().datetime().optional().nullable(),
  source_images: z.array(z.string()),
  links: LinksSchema.optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  processing_status: ProcessingStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).transform((data) => ({
  id: data._id,
  user_id: data.user_id,
  collection_id: data.collection_id,
  pin_type: data.pin_type ?? 'other',
  title: data.title ?? 'Untitled',
  summary: data.summary ?? '',
  ai_recommendation: data.ai_recommendation,
  location: data.location,
  datetime: data.datetime,
  source_images: data.source_images,
  links: data.links,
  metadata: data.metadata,
  processing_status: data.processing_status,
  created_at: data.created_at,
  updated_at: data.updated_at,
}));

export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Links = z.infer<typeof LinksSchema>;
export type PinType = z.infer<typeof PinTypeSchema>;
export type Pin = z.infer<typeof PinSchema>;

export interface PinResponse {
  _id: string;
  user_id: string;
  collection_id?: string | null;
  pin_type: PinType | null;
  title: string | null;
  summary: string | null;
  ai_recommendation?: string | null;
  location?: Location | null;
  datetime?: string | null;
  source_images: string[];
  links?: Links | null;
  metadata?: Record<string, unknown> | null;
  processing_status: ProcessingStatus;
  created_at: string;
  updated_at: string;
}

export const CreatePinRequestSchema = z.object({
  image_url: z.string().url(),
  collection_id: z.string().optional(),
});

export const UpdatePinRequestSchema = z.object({
  collection_id: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
});

export type CreatePinRequest = z.infer<typeof CreatePinRequestSchema>;
export type UpdatePinRequest = z.infer<typeof UpdatePinRequestSchema>;
