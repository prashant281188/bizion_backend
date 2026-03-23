import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { products } from "../../db/schema";
import { ListProductInput } from "./product.schema";

export const productService = {

  async list({ page = 1, limit = 10, search, categoryId }: ListProductInput) {
    const offset = (page - 1) * limit;

    const conditions = [eq(products.isDeleted, false)];
    if (search) conditions.push(ilike(products.model, `%${search}%`));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));

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
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where),
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

  async getById(id: string) {
    return db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isDeleted, false)),
      with: {
        brand: { columns: { brandName: true, brandLogo: true } },
        category: { columns: { categoryName: true } },
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
  },
};
