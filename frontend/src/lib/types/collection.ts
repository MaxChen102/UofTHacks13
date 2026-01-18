import { z } from 'zod';

export const CollectionSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).transform((data) => ({
  id: data._id,
  user_id: data.user_id,
  name: data.name,
  description: data.description ?? null,
  created_at: data.created_at,
  updated_at: data.updated_at,
}));

export type Collection = z.infer<typeof CollectionSchema>;

export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const UpdateCollectionRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;
export type UpdateCollectionRequest = z.infer<typeof UpdateCollectionRequestSchema>;
