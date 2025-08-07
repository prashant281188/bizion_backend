import { z } from "zod"

export const categorySchema = z.object({
    categoryName: z.string().min(4, { message: "categroy name must be 4 characters long" }),
    categoryDescription: z.string().optional()
})

export const categoryUpdateSchema = categorySchema.extend({
    id: z.string().uuid()
})
export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>

// ---------------------------------------------------------------------------------
export const hsnSchema = z.object({
    hsnCode: z.coerce.number().min(1, { message: "hsn code is required" }),
    hsnDescription: z.string()
})

export const hsnUpdateSchema = hsnSchema.extend({
    id: z.string().uuid()
})

export type HSNInput = z.infer<typeof hsnSchema>
export type HSNUpdateInput = z.infer<typeof hsnUpdateSchema>

// ---------------------------------------------------------------------------------
export const taxSchema = z.object({
    taxName: z.string().min(1, { message: "tax name is required" }),
    taxValue: z.coerce.number().max(100, { message: "tax value cannot be greater than 100" }).nonnegative({ message: "tax value cannot be less than 0" })
})

export const taxUpdateSchema = taxSchema.extend({
    id: z.string().uuid()
})

export type TaxUpdateInput = z.infer<typeof taxUpdateSchema>
export type TaxInput = z.infer<typeof taxSchema>


// ----------------------------------------------------------------------------------

export const groupSchema = z.object({
    id: z.string().optional(),
    groupName: z.string().min(1, { message: "hsn code is required" }),
    groupDescription: z.string().optional()
})

export const groupUpdateSchema = groupSchema.extend({
    id: z.string().uuid()
})

export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>
export type GroupInput = z.infer<typeof groupSchema>



// ----------------------------------------------------------------------------------

export const unitSchema = z.object({
    unitShortName: z.string().min(1, { message: "Unit Short Name is required" }),
    unitLongName: z.string().min(1, { message: "Unit Long Name is required" }),
})


export const unitUpdateSchema = unitSchema.extend({
    id: z.string().uuid()
})

export type UnitUpdateInput = z.infer<typeof unitUpdateSchema>
export type UnitInput = z.infer<typeof unitSchema>


// ---------------------------------------------------------------------------------

export const productVariantSchema = z.object({
    productId: z.string().optional(),
    size: z.string(),
    finish: z.string(),
    boxQty: z.coerce.number({ coerce: true }).optional(),
    mrp: z.coerce.number().optional(),
    purchaseDiscount: z.coerce.number().optional(),
    purchaseRate: z.coerce.number().optional(),
    saleRate: z.coerce.number().optional(),
    saleDiscount: z.coerce.number().optional(),
})


export const productVariantUpdateSchema = productVariantSchema.extend({
    id: z.string().uuid()
})

export type ProductVariantUpdateInput = z.infer<typeof productVariantUpdateSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>


// --------------------------------------------------------------------------------

export const productSchema = z.object({
    name: z.string().min(1, { message: "prodcut name is required" }),
    hsnId: z.string().uuid(),
    categoryId: z.string().uuid(),
    unitId: z.string().uuid(),
    taxId: z.string().uuid(),
    metal: z.string(),
    brand: z.string(),
    manufacture: z.string(),
    variants: z.array(productVariantSchema).min(1, { message: "at least one variant is required" })
})


export const productUpdateSchema = productSchema.extend({
    id: z.string().uuid(),
    variants: z.array(productVariantUpdateSchema).min(1, { message: "at lease on variant is required" })

})

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductInput = z.infer<typeof productSchema>


// ------------------------------------------------------------------------------------------------------------
export const transportSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "trasnport name is required" }),
    gstin: z.string().optional(),
    contact: z.string().optional()
})

export const transportUpdateSchema = transportSchema.extend({
    id: z.string().uuid()
})

export type TransportInput = z.infer<typeof transportSchema>

// -------------------------------------------------------------------------------------------------------------

export const partySchema = z.object({
    name: z.string().min(1, { message: "Party Name is required" }),
    gstin: z.string().optional(),
    contact: z.string(),
    email: z.string().email({ message: " Invalid Email" }).optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    pincode: z.coerce.number().min(100000, { message: "pincode must be of 6 digits" }).max(999999, { message: "pincode must be of 6 digits" }).optional(),
    groupId: z.string().optional(),
    transportId: z.string().optional(),
    // isActive: z.boolean().default(true),

})


export const partyUpdateSchema = partySchema.extend({
    id: z.string().uuid()
})

export type PartyUpdateInput = z.infer<typeof partyUpdateSchema>
export type PartyInput = z.infer<typeof partySchema>

// ----------------------------------------------------------------------------------------------------------------

