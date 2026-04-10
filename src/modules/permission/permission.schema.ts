import { z } from "zod";

export const createPermissionSchema = z.object({
  code: z.string().trim().min(1, "Permission code is required"),
  description: z.string().trim().optional(),
});

export const updatePermissionSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
  })
  .refine((d) => d.code !== undefined || d.description !== undefined, {
    message: "At least one field must be provided",
  });

export const listPermissionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type ListPermissionInput = z.infer<typeof listPermissionSchema>;
