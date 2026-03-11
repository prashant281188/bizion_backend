
import { and, eq, ilike, sql } from "drizzle-orm";
import { brands, carousel, categories, products } from "../../db/schema";
import { db } from "../../config/db";

export const publicService = {


  async getActiveCategories() {
    return db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: categories.name,
      columns: {
        id: true,
        name: true
      }
    })
  },

  async getBrands() {
    return db.select().from(brands).orderBy(brands.name)
  },

  async getProducts({ page = 1, limit = 10, search = "", category = "", brand = "" }) {

    const offset = (page - 1) * limit;

    const conditions = []

    if (category) {
      conditions.push(eq(products.categoryId, category))
    }

    if (brand) {
      conditions.push(eq(products.brandId, brand))

    }
    if (search) {
      conditions.push(ilike(products.model, `%${search}%`))
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined



    const data = await db.query.products.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: products.model,
      columns: {
        id: true,
        model: true,
        sizeType: true,
        metal: true,
        isActive: true,
      },
      with: {
        unit: {
          columns: {
            name: true,
            symbol: true
          }
        },
        brand: {
          columns: {
            name: true,
            logo: true
          }
        },
        category: {
          columns: {
            name: true
          }
        },
        variants: {
          columns: {
            id: true,
            size: true,
            packing: true,
            finish: true,
          },

          with: {
            rates: {
              columns: {
                mrp: true
              }
            },
          },


        }
      }
    })

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

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
        isActive: true,
        metal: true,
        model: true,
        id: true,
        sizeType: true,
      },
      with: {
        unit: {
          columns: {
            name: true,
            symbol: true
          }
        },
        category: {
          columns: {
            name: true
          }
        },
        brand: {
          columns: {
            name: true,
            logo: true
          }
        },
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
