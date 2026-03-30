import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  productName: z.string().trim().min(1, "Product name is required"),
  finish: z.string().trim().optional(),
  size: z.string().trim().optional(),
  boxQty: z.number().int().positive("Box quantity must be positive"),
  ratePerBox: z.number().positive("Rate must be positive"),
  notes: z.string().trim().optional(),
});

export const createFieldOrderSchema = z.object({
  partyId: z.string().uuid("Valid party ID is required"),
  notes: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const updateFieldOrderSchema = z.object({
  partyId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
});

export const addItemSchema = orderItemSchema;

export const updateItemSchema = z.object({
  productName: z.string().trim().min(1).optional(),
  finish: z.string().trim().optional(),
  size: z.string().trim().optional(),
  boxQty: z.number().int().positive().optional(),
  ratePerBox: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

export const listFieldOrderSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  partyId: z.string().uuid().optional(),
  salesmanId: z.string().uuid().optional(),
  status: z.enum(["draft", "confirmed", "cancelled"]).optional(),
});

export type CreateFieldOrderInput = z.infer<typeof createFieldOrderSchema>;
export type UpdateFieldOrderInput = z.infer<typeof updateFieldOrderSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListFieldOrderInput = z.infer<typeof listFieldOrderSchema>;
