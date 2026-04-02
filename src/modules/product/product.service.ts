import { and, asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { products, productVariants, variantRates, variantOptionValues } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateProductInput, ListProductInput, UpdateProductInput } from "./product.schema";

/* =====================================================
   HELPERS
===================================================== */

function toSlug(model: string): string {
  return model.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/* =====================================================
   SERVICE
===================================================== */

export const productService = {
  /* ================= LIST ================= */

  async list({
    page = 1,
    limit = 10,
    search,
    categoryId,
    brandId,
    status,
    isActive,
    isFeatured,
    isNew,
  }: ListProductInput) {
    const offset = (page - 1) * limit;

    const conditions = [eq(products.isDeleted, false)];
    if (search) conditions.push(ilike(products.model, `%${search}%`));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (brandId) conditions.push(eq(products.brandId, brandId));
    if (status) conditions.push(eq(products.status, status));
    if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));
    if (isFeatured !== undefined) conditions.push(eq(products.isFeatured, isFeatured));
    if (isNew !== undefined) conditions.push(eq(products.isNew, isNew));

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db.query.products.findMany({
        where,
        limit,
        offset,
        orderBy: [asc(products.model)],
        columns: {
          id: true,
          model: true,
          metal: true,
          sizeType: true,
          isActive: true,
          status: true,
          isFeatured: true,
          isNew: true,
          createdAt: true,
        },
        with: {
          brand: { columns: { brandName: true } },
          category: { columns: { categoryName: true } },
          image: { columns: { path: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(where),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  },

  /* ================= GET BY ID ================= */

  async getById(id: string) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isDeleted, false)),
      with: {
        brand: { columns: { brandName: true, brandLogo: true } },
        category: { columns: { categoryName: true } },
        hsn: { columns: { hsnCode: true, description: true } },
        unit: { columns: { unitName: true, unitSymbol: true } },
        image: { columns: { path: true } },
        variants: {
          columns: { id: true, sku: true, packing: true },
          with: {
            rates: { columns: { mrp: true, saleRate: true, purchaseRate: true } },
            optionValues: {
              columns: {},
              with: {
                optionValue: {
                  columns: { optionValue: true, position: true },
                  with: { option: { columns: { optionName: true } } },
                },
              },
            },
          },
        },
      },
    });

    return product ?? null;
  },

  /* ================= CREATE ================= */

  async create(data: CreateProductInput) {
    const { variants, slug, ...productData } = data;

    // Check duplicate brandId+model
    const existing = await db.query.products.findFirst({
      where: and(
        eq(products.model, productData.model),
        productData.brandId ? eq(products.brandId, productData.brandId) : undefined
      ),
      columns: { id: true },
    });

    if (existing) throw new AppError("A product with this model and brand already exists", 409);

    const resolvedSlug = slug || toSlug(productData.model);

    return db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({ ...productData, slug: resolvedSlug })
        .returning();

      if (variants.length > 0) {
        for (const variant of variants) {
          const { rates, optionValueIds, ...variantData } = variant;

          const [insertedVariant] = await tx
            .insert(productVariants)
            .values({ ...variantData, productId: product.id })
            .returning({ id: productVariants.id });

          if (rates && Object.values(rates).some((v) => v !== undefined)) {
            await tx.insert(variantRates).values({
              variantId: insertedVariant.id,
              mrp: rates.mrp != null ? String(rates.mrp) : undefined,
              purchaseRate: rates.purchaseRate != null ? String(rates.purchaseRate) : undefined,
              saleRate: rates.saleRate != null ? String(rates.saleRate) : undefined,
            });
          }

          if (optionValueIds && optionValueIds.length > 0) {
            await tx.insert(variantOptionValues).values(
              optionValueIds.map((optionValueId) => ({
                variantId: insertedVariant.id,
                optionValueId,
              }))
            );
          }
        }
      }

      return product;
    });
  },

  /* ================= UPDATE ================= */

  async update(id: string, data: UpdateProductInput) {
    const { variants, deleteVariantIds, deleteVariantImageIds, ...productData } = data;

    return db.transaction(async (tx) => {
      // Update product fields if any are present
      const productFieldsPresent = Object.values(productData).some((v) => v !== undefined);
      let updated: typeof products.$inferSelect | undefined;

      if (productFieldsPresent) {
        const [row] = await tx
          .update(products)
          .set({ ...productData, updatedAt: new Date() })
          .where(and(eq(products.id, id), eq(products.isDeleted, false)))
          .returning();
        if (!row) throw new AppError("Product not found", 404);
        updated = row;
      } else {
        // Still verify product exists
        const existing = await tx.query.products.findFirst({
          where: and(eq(products.id, id), eq(products.isDeleted, false)),
          columns: { id: true },
        });
        if (!existing) throw new AppError("Product not found", 404);
      }

      // Delete variants
      if (deleteVariantIds && deleteVariantIds.length > 0) {
        await tx
          .delete(productVariants)
          .where(
            and(
              eq(productVariants.productId, id),
              inArray(productVariants.id, deleteVariantIds)
            )
          );
      }

      // Upsert variants
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const { id: variantId, rates, optionValueIds, ...variantData } = variant;

          if (variantId) {
            // Update existing variant
            await tx
              .update(productVariants)
              .set(variantData)
              .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, id)));

            // Replace rates if provided
            if (rates && Object.values(rates).some((v) => v !== undefined)) {
              await tx.delete(variantRates).where(eq(variantRates.variantId, variantId));
              await tx.insert(variantRates).values({
                variantId,
                mrp: rates.mrp != null ? String(rates.mrp) : undefined,
                purchaseRate: rates.purchaseRate != null ? String(rates.purchaseRate) : undefined,
                saleRate: rates.saleRate != null ? String(rates.saleRate) : undefined,
              });
            }

            // Replace option values if provided
            if (optionValueIds !== undefined) {
              await tx.delete(variantOptionValues).where(eq(variantOptionValues.variantId, variantId));
              if (optionValueIds.length > 0) {
                await tx.insert(variantOptionValues).values(
                  optionValueIds.map((optionValueId) => ({ variantId, optionValueId }))
                );
              }
            }
          } else {
            // Create new variant — upsert on (sku, productId) to avoid duplicate key errors
            const [insertedVariant] = await tx
              .insert(productVariants)
              .values({ ...variantData, productId: id })
              .onConflictDoUpdate({
                target: [productVariants.sku, productVariants.productId],
                set: { packing: variantData.packing },
              })
              .returning({ id: productVariants.id });

            if (rates && Object.values(rates).some((v) => v !== undefined)) {
              await tx.insert(variantRates).values({
                variantId: insertedVariant.id,
                mrp: rates.mrp != null ? String(rates.mrp) : undefined,
                purchaseRate: rates.purchaseRate != null ? String(rates.purchaseRate) : undefined,
                saleRate: rates.saleRate != null ? String(rates.saleRate) : undefined,
              });
            }

            if (optionValueIds && optionValueIds.length > 0) {
              await tx.insert(variantOptionValues).values(
                optionValueIds.map((optionValueId) => ({
                  variantId: insertedVariant.id,
                  optionValueId,
                }))
              );
            }
          }
        }
      }

      return updated ?? { id };
    });
  },

  /* ================= SOFT DELETE ================= */

  async remove(id: string) {
    const [updated] = await db
      .update(products)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.isDeleted, false)))
      .returning({ id: products.id });

    if (!updated) throw new AppError("Product not found", 404);
  },
};
