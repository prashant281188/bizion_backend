import { z } from "zod";

export const createCarouselSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateCarouselSchema = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    image: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateCarouselInput = z.infer<typeof createCarouselSchema>;
export type UpdateCarouselInput = z.infer<typeof updateCarouselSchema>;
