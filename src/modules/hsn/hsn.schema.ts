import { z } from "zod";

export const createHsnSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(10),

  description: z
    .string()
    .max(255)
    .optional(),

});

export const updateHsnSchema = z.object({
  description: z
    .string()
    .max(255)
    .optional(),

  isActive: z.boolean().optional(),
});