import { z } from "zod";


const allocationSchema = z.object({
  orderItemId: z.string().uuid("Valid order item ID required"),
  allocatedQty: z.coerce.number().positive("Allocated quantity must be positive"),
});

const dispatchItemSchema = z.object({
  variantId: z.string().uuid("Valid variant ID required"),
  totalQty: z.coerce.number().positive("Total quantity must be positive"),
  allocations: z.array(allocationSchema).min(1, "At least one allocation is required"),
});

const updateDispatchItemSchema = z.object({
  id: z.string().uuid().optional(),
  variantId: z.string().uuid("Valid variant ID required"),
  totalQty: z.coerce.number().positive("Total quantity must be positive"),
  allocations: z.array(allocationSchema).min(1, "At least one allocation is required"),
});

export const createDispatchSchema = z.object({
  dispatchNumber: z.string().trim().min(1, "Dispatch number is required"),
  dispatchedAt: z.coerce.date(),
  notes: z.string().optional(),
  nop: z.coerce.number().optional(),
  transport: z.string().optional(),
  items: z.array(dispatchItemSchema).min(1, "At least one item is required"),
});

export const updateDispatchSchema = z.object({
  dispatchNumber: z.string().trim().min(1).optional(),
  dispatchedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  nop: z.coerce.number().optional(),
  transport: z.string().optional(),
  items: z.array(updateDispatchItemSchema).min(1).optional(),
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]).optional(),
})

export const listDispatchSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  search: z.string().optional(),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type UpdateDispatchInput = z.infer<typeof updateDispatchSchema>;
export type ListDispatchInput = z.infer<typeof listDispatchSchema>;
