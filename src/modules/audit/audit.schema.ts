import { z } from "zod";

export const listAuditSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  action: z
    .enum(["create", "update", "delete", "restore", "login", "logout", "export", "import"])
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListAuditInput = z.infer<typeof listAuditSchema>;
