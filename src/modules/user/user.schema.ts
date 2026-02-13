import { z } from "zod";

/* =====================================================
   COMMON
===================================================== */

const uuid = z.string().uuid("Invalid UUID");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[a-z]/, "Must include at least one lowercase letter")
  .regex(/[0-9]/, "Must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Must include at least one special character");

/* =====================================================
   CREATE USER (ADMIN ONLY)
===================================================== */

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  roleId: uuid,
  isActive: z.boolean().optional(),
});

/* =====================================================
   UPDATE USER
===================================================== */

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    roleId: uuid.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.email ||
      data.password ||
      data.roleId ||
      data.isActive !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

/* =====================================================
   LIST USERS (PAGINATION + SEARCH)
===================================================== */

export const listUserSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  roleId: uuid.optional(),
  isActive: z.coerce.boolean().optional(),
});

/* =====================================================
   PARAMS
===================================================== */

export const userIdSchema = z.object({
  id: uuid,
});

/* =====================================================
   TYPES
===================================================== */

export type CreateUserInput = z.infer<
  typeof createUserSchema
>;

export type UpdateUserInput = z.infer<
  typeof updateUserSchema
>;

export type ListUserInput = z.infer<
  typeof listUserSchema
>;
