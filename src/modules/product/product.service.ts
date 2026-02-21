
import { eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { categories, products } from "../../db/schema";

export const productService = {
  async list({ page = 1, limit = 10, search="" }) {
    const offset = (page - 1) * limit;

    const where = search
      ? ilike(products.model, `%${search}%`)
      : undefined;

    const items = await db
      .select({
        ...products,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(
        categories,
        eq(products.categoryId, categories.id)
      )
      .where(where)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where);

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

  async getById(id: string) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) return null;

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id));

    for (const variant of variants) {
      variant.rates = await db
        .select()
        .from(productRates)
        .where(eq(productRates.variantId, variant.id));
    }

    return { ...product, variants };
  },

  async create(data: any) {
    const [product] = await db
      .insert(products)
      .values(data)
      .returning();

    return product;
  },

  async update(id: string, data: any) {
    const [updated] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();

    return updated ?? null;
  },

  async remove(id: string) {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));

    return result.rowCount > 0;
  },
};
