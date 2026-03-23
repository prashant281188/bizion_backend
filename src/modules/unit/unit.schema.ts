import { z } from "zod";

export const createUnitSchema = z.object({
  unitName: z.string().trim().min(1, "Unit name is required"),
  unitSymbol: z.string().trim().min(1).optional(),
});

export const updateUnitSchema = z
  .object({
    unitName: z.string().trim().min(1).optional(),
    unitSymbol: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.unitName !== undefined || d.unitSymbol !== undefined, {
    message: "At least one field must be provided",
  });

export const listUnitSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type ListUnitInput = z.infer<typeof listUnitSchema>;
