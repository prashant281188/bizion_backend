import { z } from "zod";

const allocationSchema = z.object({
  fieldOrderItemId: z.string().uuid("Valid order item ID required"),
  allocatedQty: z.number().positive("Allocated quantity must be positive"),
});

const dispatchItemSchema = z.object({
  orderItemId: z.string().uuid("Valid order item ID required"),
  variantId: z.string().uuid().optional(),
  totalQty: z.number().positive("Total quantity must be positive"),
  allocations: z.array(allocationSchema).optional(),
});

export const createDispatchSchema = z.object({
  dispatchNumber: z.string().trim().min(1, "Dispatch number is required"),
  items: z.array(dispatchItemSchema).min(1, "At least one item is required"),
});

export const listDispatchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type ListDispatchInput = z.infer<typeof listDispatchSchema>;
