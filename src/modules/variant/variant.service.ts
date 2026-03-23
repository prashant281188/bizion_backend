import { and, eq } from "drizzle-orm";
import { db } from "../../config/db";
import { products, productVariants, variantRates, variantOptionValues } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { AssignOptionValuesInput, CreateRateInput, CreateVariantInput, UpdateVariantInput } from "./variant.schema";

export const variantService = {
  /* ===== GET VARIANT ===== */

  async getById(id: string) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, id),
      with: {
        rates: { columns: { id: true, mrp: true, saleRate: true, purchaseRate: true, from: true, to: true } },
        optionValues: {
          columns: {},
          with: { optionValue: { columns: { id: true, optionValue: true, position: true }, with: { option: { columns: { optionName: true } } } } },
        },
      },
    });
    if (!variant) throw new AppError("Variant not found", 404);
    return variant;
  },

  /* ===== ADD VARIANT TO PRODUCT ===== */

  async create(productId: string, data: CreateVariantInput) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isDeleted, false)),
      columns: { id: true },
    });
    if (!product) throw new AppError("Product not found", 404);

    const { rates, optionValueIds, ...variantData } = data;

    return db.transaction(async (tx) => {
      const [variant] = await tx
        .insert(productVariants)
        .values({ ...variantData, productId })
        .returning();

      if (rates && Object.values(rates).some((v) => v !== undefined)) {
        await tx.insert(variantRates).values({
          variantId: variant.id,
          mrp: rates.mrp,
          purchaseRate: rates.purchaseRate,
          saleRate: rates.saleRate,
        });
      }

      if (optionValueIds && optionValueIds.length > 0) {
        await tx.insert(variantOptionValues).values(
          optionValueIds.map((optionValueId) => ({ variantId: variant.id, optionValueId }))
        );
      }

      return variant;
    });
  },

  /* ===== UPDATE VARIANT ===== */

  async update(id: string, data: UpdateVariantInput) {
    const [updated] = await db
      .update(productVariants)
      .set(data)
      .where(eq(productVariants.id, id))
      .returning();
    if (!updated) throw new AppError("Variant not found", 404);
    return updated;
  },

  /* ===== DELETE VARIANT ===== */

  async remove(id: string) {
    const [deleted] = await db
      .delete(productVariants)
      .where(eq(productVariants.id, id))
      .returning({ id: productVariants.id });
    if (!deleted) throw new AppError("Variant not found", 404);
  },

  /* ===== RATES ===== */

  async addRate(variantId: string, data: CreateRateInput) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      columns: { id: true },
    });
    if (!variant) throw new AppError("Variant not found", 404);

    const [rate] = await db.insert(variantRates).values({
      variantId,
      mrp: data.mrp,
      purchaseRate: data.purchaseRate,
      saleRate: data.saleRate,
      from: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      to: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
    }).returning();

    return rate;
  },

  async removeRate(variantId: string, rateId: string) {
    const [deleted] = await db
      .delete(variantRates)
      .where(and(eq(variantRates.id, rateId), eq(variantRates.variantId, variantId)))
      .returning({ id: variantRates.id });
    if (!deleted) throw new AppError("Rate not found", 404);
  },

  /* ===== OPTION VALUES ===== */

  async assignOptionValues(variantId: string, data: AssignOptionValuesInput) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      columns: { id: true },
    });
    if (!variant) throw new AppError("Variant not found", 404);

    // Remove existing and re-assign
    await db.delete(variantOptionValues).where(eq(variantOptionValues.variantId, variantId));

    if (data.optionValueIds.length > 0) {
      await db.insert(variantOptionValues).values(
        data.optionValueIds.map((optionValueId) => ({ variantId, optionValueId }))
      );
    }
  },

  async removeOptionValue(variantId: string, optionValueId: string) {
    const [deleted] = await db
      .delete(variantOptionValues)
      .where(and(eq(variantOptionValues.variantId, variantId), eq(variantOptionValues.optionValueId, optionValueId)))
      .returning({ id: variantOptionValues.id });
    if (!deleted) throw new AppError("Option value assignment not found", 404);
  },
};
