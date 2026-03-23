import { z } from "zod";

const uuid = z.string().uuid("Invalid UUID");

/* ===== ROLE ===== */

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
});

/* ===== PERMISSION ===== */

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

/* ===== PERMISSION ASSIGNMENT ===== */

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(uuid).min(1, "At least one permission ID is required"),
});

export const listRoleSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const listPermissionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type ListRoleInput = z.infer<typeof listRoleSchema>;
export type ListPermissionInput = z.infer<typeof listPermissionSchema>;
