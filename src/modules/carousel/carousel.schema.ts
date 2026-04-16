import { z } from "zod";

export const listCarouselSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
});

export const createCarouselSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  linkUrl: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  order: z.number({ coerce: true }).optional()
});

export const updateCarouselSchema = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    linkUrl: z.string().trim().optional(),
    image: z.string().trim().optional(),
    isActive: z.boolean().optional(),
    order: z.number({ coerce: true }).optional()
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type ListCarouselInput = z.infer<typeof listCarouselSchema>;
export type CreateCarouselInput = z.infer<typeof createCarouselSchema>;
export type UpdateCarouselInput = z.infer<typeof updateCarouselSchema>;
