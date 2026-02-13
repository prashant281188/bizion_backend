import { z } from "zod";

export const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
});

export const createSchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().uuid().optional().nullable(),
});


export const updateSchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().uuid().optional().nullable(),
});