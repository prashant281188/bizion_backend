import { and, asc, desc, eq, inArray, isNull, ilike, sql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "../../config/db";
import * as schema from "../../db/schema";

/** Accepts either the db instance or a transaction — matches the pattern used across this codebase */
type Tx = PgTransaction<PostgresJsQueryResultHKT, typeof schema, any>;
import {
  products,
  productImages,
  productVariants,
  variantRates,
  variantOptionValues,
  variantImages,
  hsnGstHistory,
  gstRates,
} from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateProductInput, ListProductInput, UpdateProductInput } from "./product.schema";
import { resolveImageUrl } from "../store/store.service";

/* =====================================================
   HELPERS
===================================================== */

/** Converts a model name to a URL-safe slug (lowercase, hyphens, no specials) */
function toSlug(model: string): string {
  return model.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Maps sortBy query param to the corresponding Drizzle column */
function getSortColumn(sortBy: string) {
  const map: Record<string, unknown> = {
    model:     products.model,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  };
  return map[sortBy] ?? products.model;
}

/**
 * Closes the currently active rate for a variant (sets effectiveTo = now).
 * Should always be called inside a transaction before inserting a new rate.
 */
async function closeActiveRate(tx: Tx, variantId: string) {
  await tx
    .update(variantRates)
    .set({ effectiveTo: new Date() })
    .where(and(eq(variantRates.variantId, variantId), isNull(variantRates.effectiveTo)));
}

/* =====================================================
   SERVICE
===================================================== */

export const productService = {

  /* ─────────────────────────────────────────────────
     LIST
     Returns a paginated, filtered, sorted product list.
     Each item includes: id, model, metal, sizeType,
     flags, status, brand name, category name, and the
     cover image resolved to a full S3 URL.
  ───────────────────────────────────────────────── */

  async list({
    page       = 1,
    limit      = 10,
    search,
    categoryId,
    brandId,
    status,
    isActive,
    isFeatured,
    isNew,
    sortBy     = "model",
    sortOrder  = "asc",
  }: ListProductInput) {
    const offset = (page - 1) * limit;

    // Build WHERE conditions dynamically based on provided filters
    const conditions = [eq(products.isDeleted, false)];
    if (search)                conditions.push(ilike(products.model, `%${search}%`));
    if (categoryId)            conditions.push(eq(products.categoryId, categoryId));
    if (brandId)               conditions.push(eq(products.brandId, brandId));
    if (status)                conditions.push(eq(products.status, status));
    if (isActive   !== undefined) conditions.push(eq(products.isActive, isActive));
    if (isFeatured !== undefined) conditions.push(eq(products.isFeatured, isFeatured));
    if (isNew      !== undefined) conditions.push(eq(products.isNew, isNew));

    const where   = and(...conditions);
    const orderFn = sortOrder === "desc" ? desc : asc;

    const [items, [{ count }]] = await Promise.all([
      db.query.products.findMany({
        where,
        limit,
        offset,
        orderBy: [orderFn(getSortColumn(sortBy) as any)],
        columns: {
          id: true, model: true, metal: true, sizeType: true,
          isActive: true, status: true, isFeatured: true, isNew: true, createdAt: true,
        },
        with: {
          brand:    { columns: { brandName: true } },
          category: { columns: { categoryName: true } },
          image:    { columns: { path: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(where),
    ]);

    return {
      items: items.map((p) => ({ ...p, image: resolveImageUrl(p.image) })),
      meta: {
        page,
        limit,
        total:      Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  },

  /* ─────────────────────────────────────────────────
     GET BY ID
     Returns full product detail for a single product.

     HSN / GST chain resolved here:
       product.hsnId
         → hsnCodes (hsnCode, description)
           → hsnGstHistory [current: effectiveTo IS NULL]
             → gstGroups (name)
               → gstRates [current: effectiveTo IS NULL] (cgst, sgst, igst)

     The resolved shape is flattened into product.hsn.currentGst
     so the frontend gets CGST/SGST/IGST without multiple requests.

     Variants returned include:
       - sku, barcode, packing, isActive
       - rate: the CURRENT pricing row (effectiveTo IS NULL)
       - options: flattened option name + value pairs
       - images: gallery sorted by position, each with a resolved S3 URL
  ───────────────────────────────────────────────── */

  async getById(id: string) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isDeleted, false)),
      with: {
        brand:    { columns: { brandName: true, brandLogo: true } },
        category: { columns: { categoryName: true } },
        unit:     { columns: { unitName: true, unitSymbol: true } },
        image:    { columns: { path: true } },

        // ── HSN → GST chain ───────────────────────────────────────────
        hsn: {
          columns: { id: true, hsnCode: true, description: true },
          with: {
            // Only the currently active GST assignment (effectiveTo IS NULL)
            gstHistory: {
              where: isNull(hsnGstHistory.effectiveTo),
              limit: 1,
              columns: { id: true, effectiveFrom: true },
              with: {
                gstGroup: {
                  columns: { id: true, name: true },
                  with: {
                    // Current rate for this GST group (effectiveTo IS NULL)
                    rates: {
                      where: isNull(gstRates.effectiveTo),
                      limit: 1,
                      columns: {
                        id: true, cgst: true, sgst: true,
                        igst: true, effectiveFrom: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // ── Variants ──────────────────────────────────────────────────
        variants: {
          where: eq(productVariants.isDeleted, false),
          columns: {
            id: true, sku: true, barcode: true,
            packing: true, isActive: true,
          },
          with: {
            // Current pricing row (effectiveTo IS NULL = open-ended)
            rates: {
              where: isNull(variantRates.effectiveTo),
              columns: { mrp: true, saleRate: true, purchaseRate: true, effectiveFrom: true },
              limit: 1,
            },
            optionValues: {
              columns: {},
              with: {
                optionValue: {
                  columns: { optionValue: true, position: true },
                  with: { option: { columns: { optionName: true } } },
                },
              },
            },
            images: {
              columns: { id: true, path: true, alt: true, position: true, isPrimary: true },
              orderBy: [asc(variantImages.position)],
            },
          },
        },
      },
    });

    if (!product) return null;

    // ── Flatten HSN → GST chain into a clean currentGst shape ─────────
    const hsnEntry = product.hsn?.gstHistory?.[0] ?? null;
    const gstGroupEntry = hsnEntry?.gstGroup ?? null;
    const gstRateEntry  = gstGroupEntry?.rates?.[0] ?? null;

    const resolvedHsn = product.hsn
      ? {
          id:          product.hsn.id,
          hsnCode:     product.hsn.hsnCode,
          description: product.hsn.description,
          /**
           * The currently applicable GST for this product.
           * null when no GST group has been assigned to this HSN code yet.
           */
          currentGst: gstGroupEntry
            ? {
                gstHistoryId:  hsnEntry!.id,
                assignedFrom:  hsnEntry!.effectiveFrom,
                groupId:       gstGroupEntry.id,
                groupName:     gstGroupEntry.name,
                rateId:        gstRateEntry?.id   ?? null,
                cgst:          gstRateEntry?.cgst  ?? null,
                sgst:          gstRateEntry?.sgst  ?? null,
                igst:          gstRateEntry?.igst  ?? null,
                rateEffectiveFrom: gstRateEntry?.effectiveFrom ?? null,
              }
            : null,
        }
      : null;

    return {
      ...product,
      hsn:   resolvedHsn,
      image: resolveImageUrl(product.image),
      variants: product.variants.map((v) => ({
        ...v,
        rate:   v.rates[0] ?? null,
        rates:  undefined,
        images: v.images.map((img) => ({ ...img, url: resolveImageUrl(img) })),
      })),
    };
  },

  /* ─────────────────────────────────────────────────
     CREATE
     Inserts the product and all variants in one atomic
     transaction. Accepts an optional S3 image key so
     the cover image and its productId FK can be set
     correctly without leaving orphan image rows.

     Flow:
       1. Duplicate model+brand check
       2. INSERT product (imageId = null initially)
       3. If imageKey: INSERT productImage → UPDATE product.imageId
       4. For each variant: INSERT variant → rates → option-value links
  ───────────────────────────────────────────────── */

  async create(data: CreateProductInput, imageKey?: string) {
    const { variants, slug, imageId: _unused, ...productData } = data;

    // Guard: model + brand combination must be unique
    const existing = await db.query.products.findFirst({
      where: and(
        eq(products.model, productData.model),
        ...(productData.brandId ? [eq(products.brandId, productData.brandId)] : [])
      ),
      columns: { id: true },
    });
    if (existing) throw new AppError("A product with this model and brand already exists", 409);

    const resolvedSlug = slug || toSlug(productData.model);

    return db.transaction(async (tx) => {
      // 1. Insert product without imageId first (avoids circular-FK issue)
      const [product] = await tx
        .insert(products)
        .values({ ...productData, slug: resolvedSlug })
        .returning();

      // 2. Insert cover image if an S3 key was provided, then link it back
      if (imageKey) {
        const [img] = await tx
          .insert(productImages)
          .values({ productId: product.id, path: imageKey, isPrimary: true })
          .returning({ id: productImages.id });

        await tx
          .update(products)
          .set({ imageId: img.id })
          .where(eq(products.id, product.id));

        product.imageId = img.id; // keep returned object consistent
      }

      // 3. Insert each variant with rates and option-value links
      for (const variant of variants) {
        const { rates, optionValueIds, ...variantData } = variant;

        const [insertedVariant] = await tx
          .insert(productVariants)
          .values({
            ...variantData,
            productId: product.id,
            packing: variantData.packing != null ? String(variantData.packing) : undefined,
          })
          .returning({ id: productVariants.id });

        // Initial rate — effectiveFrom defaults to now(), effectiveTo = null (open)
        if (rates) {
          await tx.insert(variantRates).values({
            variantId:    insertedVariant.id,
            mrp:          rates.mrp          != null ? String(rates.mrp)          : undefined,
            purchaseRate: rates.purchaseRate  != null ? String(rates.purchaseRate) : undefined,
            saleRate:     rates.saleRate      != null ? String(rates.saleRate)     : undefined,
          });
        }

        // Link option values (e.g. Size=L, Colour=Red)
        if (optionValueIds && optionValueIds.length > 0) {
          await tx.insert(variantOptionValues).values(
            optionValueIds.map((optionValueId) => ({ variantId: insertedVariant.id, optionValueId }))
          );
        }
      }

      return product;
    });
  },

  /* ─────────────────────────────────────────────────
     UPDATE
     Partial update of product fields + variant upsert.
     Accepts an optional new S3 image key; when provided
     the old cover image DB row is deleted and a new one
     is created (S3 deletion is handled by the controller).

     Rate changes use append-only history:
       close old rate (effectiveTo = now) → insert new rate

     Variant images (deleteVariantImageIds) are removed
     from the DB here; the controller handles S3 deletion
     before calling this method.
  ───────────────────────────────────────────────── */

  async update(id: string, data: UpdateProductInput, imageKey?: string) {
    const { variants, deleteVariantIds, deleteVariantImageIds, imageId: _unused, ...productData } = data;

    return db.transaction(async (tx) => {

      // ── 1. Fetch current product (needed for old imageId) ─────────────
      const currentProduct = await tx.query.products.findFirst({
        where: and(eq(products.id, id), eq(products.isDeleted, false)),
        columns: { id: true, imageId: true },
      });
      if (!currentProduct) throw new AppError("Product not found", 404);

      // ── 2. Handle cover image replacement ─────────────────────────────
      let newImageId: string | undefined;
      if (imageKey) {
        // Insert new image row
        const [newImg] = await tx
          .insert(productImages)
          .values({ productId: id, path: imageKey, isPrimary: true })
          .returning({ id: productImages.id });

        newImageId = newImg.id;

        // Remove old image row from DB (caller is responsible for S3 deletion)
        if (currentProduct.imageId) {
          await tx
            .delete(productImages)
            .where(eq(productImages.id, currentProduct.imageId));
        }
      }

      // ── 3. Update product scalar fields ───────────────────────────────
      const fieldsToUpdate = {
        ...productData,
        ...(newImageId ? { imageId: newImageId } : {}),
      };
      const hasProductUpdate = Object.values(fieldsToUpdate).some((v) => v !== undefined);

      if (hasProductUpdate) {
        await tx
          .update(products)
          .set({ ...fieldsToUpdate, updatedAt: new Date() })
          .where(eq(products.id, id));
      }

      // ── 4. Hard-delete requested variants (cascades to rates, option-values, images) ──
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

      // ── 5. Delete variant image DB rows (S3 keys already deleted by controller) ──
      if (deleteVariantImageIds && deleteVariantImageIds.length > 0) {
        await tx
          .delete(variantImages)
          .where(inArray(variantImages.id, deleteVariantImageIds));
      }

      // ── 6. Upsert variants ────────────────────────────────────────────
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const { id: variantId, rates, optionValueIds, ...variantData } = variant;

          if (variantId) {
            // ── 6a. Update existing variant ──────────────────────────
            await tx
              .update(productVariants)
              .set({
                ...variantData,
                packing:   variantData.packing != null ? String(variantData.packing) : undefined,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(productVariants.id, variantId),
                  eq(productVariants.productId, id)
                )
              );

            // Rate history: close current active rate, open a new one
            if (rates) {
              await closeActiveRate(tx, variantId);
              await tx.insert(variantRates).values({
                variantId,
                mrp:          rates.mrp          != null ? String(rates.mrp)          : undefined,
                purchaseRate: rates.purchaseRate  != null ? String(rates.purchaseRate) : undefined,
                saleRate:     rates.saleRate      != null ? String(rates.saleRate)     : undefined,
              });
            }

            // Replace option values with the new full set (if provided)
            if (optionValueIds !== undefined) {
              await tx
                .delete(variantOptionValues)
                .where(eq(variantOptionValues.variantId, variantId));
              if (optionValueIds.length > 0) {
                await tx.insert(variantOptionValues).values(
                  optionValueIds.map((optionValueId) => ({ variantId, optionValueId }))
                );
              }
            }

          } else {
            // ── 6b. Insert new variant ────────────────────────────────
            const packingStr = variantData.packing != null ? String(variantData.packing) : undefined;

            const [insertedVariant] = await tx
              .insert(productVariants)
              .values({ ...variantData, productId: id, packing: packingStr })
              .onConflictDoUpdate({
                target: [productVariants.sku, productVariants.productId],
                set:    { packing: packingStr, updatedAt: new Date() },
              })
              .returning({ id: productVariants.id });

            if (rates) {
              await tx.insert(variantRates).values({
                variantId:    insertedVariant.id,
                mrp:          rates.mrp          != null ? String(rates.mrp)          : undefined,
                purchaseRate: rates.purchaseRate  != null ? String(rates.purchaseRate) : undefined,
                saleRate:     rates.saleRate      != null ? String(rates.saleRate)     : undefined,
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

      return { id, ...(newImageId ? { imageId: newImageId } : {}) };
    });
  },

  /* ─────────────────────────────────────────────────
     SOFT DELETE
     Sets isDeleted = true and records deletedAt.
     Product data is retained for audit purposes.
     All associated variants remain in DB (also soft-
     deleted implicitly via the product flag).
  ───────────────────────────────────────────────── */

  async remove(id: string) {
    const [updated] = await db
      .update(products)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.isDeleted, false)))
      .returning({ id: products.id });

    if (!updated) throw new AppError("Product not found", 404);
  },

  /* ─────────────────────────────────────────────────
     GET OLD IMAGE PATH (internal helper for controller)
     Fetches the S3 key of the current cover image so
     the controller can delete it from S3 before calling
     service.update().
  ───────────────────────────────────────────────── */

  async getOldCoverImagePath(productId: string): Promise<string | null> {
    const row = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isDeleted, false)),
      columns: { imageId: true },
    });
    if (!row?.imageId) return null;

    const img = await db.query.productImages.findFirst({
      where: eq(productImages.id, row.imageId),
      columns: { path: true },
    });
    return img?.path ?? null;
  },
};
