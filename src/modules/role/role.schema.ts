import { z } from "zod";

const uuid = z.string().uuid("Invalid UUID");

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(uuid).min(1, "At least one permission ID is required"),
});

export const updatePermissionsSchema = z
  .object({
    add: z.array(uuid).optional(),
    remove: z.array(uuid).optional(),
  })
  .refine((d) => (d.add?.length ?? 0) + (d.remove?.length ?? 0) > 0, {
    message: "Provide at least one permission ID in 'add' or 'remove'",
  });

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;

export const listRoleSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type ListRoleInput = z.infer<typeof listRoleSchema>;
