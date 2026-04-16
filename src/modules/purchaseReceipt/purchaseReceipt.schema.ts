import { z } from "zod";

const allocationSchema = z.object({
  orderItemId: z.string().uuid("Valid order item ID required"),
  allocatedQty: z.coerce.number().positive("Allocated quantity must be positive"),
});

const receiptItemSchema = z.object({
  variantId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  totalQty: z.coerce.number().positive("Total quantity must be positive"),
  allocations: z.array(allocationSchema).optional(),
});

export const createPurchaseReceiptSchema = z.object({
  orderId: z.string().uuid("Valid order ID is required"),
  receivedDate: z.coerce.date().optional(),
  items: z.array(receiptItemSchema).min(1, "At least one item is required"),
});

export const listPurchaseReceiptSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  orderId: z.string().uuid().optional(),
});

export type CreatePurchaseReceiptInput = z.infer<typeof createPurchaseReceiptSchema>;
export type ListPurchaseReceiptInput = z.infer<typeof listPurchaseReceiptSchema>;
