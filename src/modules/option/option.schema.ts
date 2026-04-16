import { z } from "zod";

/* ===== OPTION ===== */

export const createOptionSchema = z.object({
  optionName: z.string().trim().min(1, "Option name is required"),
});

export const updateOptionSchema = z.object({
  optionName: z.string().trim().min(1, "Option name is required"),
});

export const listOptionSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
});

/* ===== OPTION VALUE ===== */

export const createOptionValueSchema = z.object({
  optionValue: z.string().trim().min(1, "Option value is required"),
  position: z.number().int().min(0).default(0).optional(),
});

export const updateOptionValueSchema = z
  .object({
    optionValue: z.string().trim().min(1).optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine((d) => d.optionValue !== undefined || d.position !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;
export type ListOptionInput = z.infer<typeof listOptionSchema>;
export type CreateOptionValueInput = z.infer<typeof createOptionValueSchema>;
export type UpdateOptionValueInput = z.infer<typeof updateOptionValueSchema>;
