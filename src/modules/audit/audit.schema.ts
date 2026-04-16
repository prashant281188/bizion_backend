import { z } from "zod";

export const listAuditSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
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
