import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  sku: z.string().trim().min(1, "SKU is required"),
  boxQty: z.number().int().positive("Box quantity must be positive"),
  packing: z.number().positive("Packing must be positive"),
  orderQty: z.number().positive().optional(),
  rate: z.number().positive("Rate must be positive"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  orderType: z.enum(["purchase", "sale"]),
  orderDate: z.string().date().optional(),
  partyId: z.string().uuid("Valid party ID is required"),
  notes: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const updateOrderSchema = z.object({
  orderDate: z.string().date().optional(),
  partyId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["draft", "confirmed", "partial", "completed", "cancelled"]).optional(),
});

export const addItemSchema = orderItemSchema;

export const updateItemSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  boxQty: z.number().int().positive().optional(),
  packing: z.number().positive().optional(),
  orderQty: z.number().positive().optional(),
  rate: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

export const nextOrderNumberSchema = z.object({
  orderType: z.enum(["purchase", "sale"]),
});

export const listOrderSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  partyId: z.string().uuid().optional(),
  salesmanId: z.string().uuid().optional(),
  orderType: z.enum(["purchase", "sale"]).optional(),
  status: z.enum(["draft", "confirmed", "partial", "completed", "cancelled"]).optional(),
});

export type NextOrderNumberInput = z.infer<typeof nextOrderNumberSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListOrderInput = z.infer<typeof listOrderSchema>;
