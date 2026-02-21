
import { eq, ilike, sql } from "drizzle-orm";
import { brands, carousel, categories, products } from "../../db/schema";
import { db } from "../../config/db";

export const publicService = {


  async getActiveCategories() {
    return db.query.categories.findMany({
      where: eq(categories.isActive, true),
      columns: {
        id: true,
        name: true
      }
    })
  },

  async getBrands() {
    return db.select().from(brands)
  },

  async getProducts({ page = 1, limit = 10, search = "" }) {

    const offset = (page - 1) * limit;
    const where = search
      ? ilike(products.model, `%${search}%`)
      : undefined;

    const data = await db.query.products.findMany({
      where: where,
      limit,
      offset,
      columns: {
        brand: true,
        isActive: true,
        metal: true,
        model: true,
        id: true,
      },
      with: {
        category: { columns: { name: true } },
        variants: {
          columns: { size: true, packing: true },
          with: {
            rates: {
              columns: {
                mrp: true
              }
            }
          }
        }
      }
    })

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where);
      
    return {
      data,
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit)
      }
    }
  },

  async getProductDetail(id: string) {
    return db.query.products.findFirst({
      where: eq(products.id, id),
      columns: {
        brand: true,
        isActive: true,
        metal: true,
        model: true,
        id: true,
      },
      with: {
        category: { columns: { name: true } },
        variants: {
          columns: { size: true, packing: true, finish: true },
          with: {
            rates: {
              columns: {
                mrp: true
              }
            }
          }
        }
      },

    },)
  },

  async getCarouselData() {
    return db.query.carousel.findMany({
      where: eq(carousel.isActive, true),

    })
  }

};
