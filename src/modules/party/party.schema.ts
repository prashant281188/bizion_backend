import { z } from "zod";

export const createPartySchema = z.object({
  name: z.string().trim().min(1, "Party name is required"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  type: z.enum(["retailer", "supplier", "customer", "distributor"]),
  city: z.string().trim().optional(),
  gstNo: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const updatePartySchema = createPartySchema.partial();

export const listPartySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
export type ListPartyInput = z.infer<typeof listPartySchema>;
