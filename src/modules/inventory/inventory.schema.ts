import { z } from "zod";

const txTypes = ["purchase", "sale", "adjustment", "return", "transfer"] as const;

export const createTransactionSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  partyId: z.string().uuid("Invalid party ID").optional(),
  type: z.enum(txTypes),
  quantity: z.number().int().refine((n) => n !== 0, "Quantity cannot be zero"),
  location: z.string().trim().default("default"),
  note: z.string().trim().optional(),
});

export const listTransactionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  variantId: z.string().uuid().optional(),
  partyId: z.string().uuid().optional(),
  type: z.enum(txTypes).optional(),
  location: z.string().optional(),
});

export const listInventorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  variantId: z.string().uuid().optional(),
  location: z.string().optional(),
});

export const adjustInventorySchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  location: z.string().trim().default("default"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  note: z.string().trim().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionInput = z.infer<typeof listTransactionSchema>;
export type ListInventoryInput = z.infer<typeof listInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
