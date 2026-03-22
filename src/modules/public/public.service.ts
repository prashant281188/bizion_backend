
import { and, eq, ilike, sql, inArray, asc, desc } from "drizzle-orm";
import {
  brands, carousel, categories, products, productVariants,
  variantOptionValues,
  optionValues,
  options,
  productRates
} from "../../db/schema";
import { db } from "../../config/db";
import { transformProduct } from "../../utils/transformProducts";
type QueryParams = {
  page?: number
  limit?: number
  category?: string
  brand?: string
  size?: string[]
  finish?: string[]
  sort?: string
}
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
      orderBy: [products.categoryId, products.model],
      columns: {
        id: true,
        model: true,
        metal: true,
        isActive: true,
      },
      with: {
        unit: {
          columns: {
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
        image: {
          columns: {
            path: true
          }
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
    const data = await (db.query.products.findFirst({
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

          columns: {
            id: true,
            packing: true,
            sku: true
          },

          with: {
            optionValues: {
              columns: {},

              with: {
                optionValue: {

                  columns: {
                    value: true,
                    position: true
                  },
                  with: {
                    option: {
                      columns: {
                        name: true

                      }
                    }
                  },
                },
              }
            },
            rates: {
              columns: {
                mrp: true
              }
            },
          },
        }
      },

    },))

    return transformProduct(data)
  },

  async getCarouselData() {
    return db.query.carousel.findMany({
      where: eq(carousel.isActive, true),

    })
  },

  async getProductDetailNew(id: string) {
    const result = await db.execute(sql`
    
    WITH variant_options AS (
  SELECT
    pv.id AS variant_id,
    pv.product_id,
    pv.sku,
    jsonb_object_agg(opt.name, ov.value ORDER BY ov.position) AS options
  FROM bizion.public.product_variants pv
  left JOIN bizion.public.variant_option_values vov 
    ON pv.id = vov.variant_id
 left JOIN bizion.public.option_values ov 
    ON vov.option_value_id = ov.id
 left JOIN bizion.public.options opt 
    ON ov.option_id = opt.id
  GROUP BY pv.id, pv.product_id, pv.sku
),

-- ✅ deduplicate once
dedup_option_values AS (
  SELECT
    pv.product_id,
    opt.name AS option_name,
    ov.value,
    ov.position
  FROM bizion.public.product_variants pv
 left JOIN bizion.public.variant_option_values vov 
    ON pv.id = vov.variant_id
 left JOIN bizion.public.option_values ov 
    ON vov.option_value_id = ov.id
 left JOIN bizion.public.options opt 
    ON ov.option_id = opt.id
  GROUP BY
    pv.product_id,
    opt.name,
    ov.value,
    ov.position
)

SELECT
  p.id,
  p.model,
  p.image_id,
  c.name AS category,
  b.name AS brand,
  p.size_type,
  u.symbol AS unit,

  -- 🔥 variants
  jsonb_agg(
    jsonb_build_object(
      'variant_id', vo.variant_id,
      'sku', vo.sku,
      'options', vo.options
    )
    ORDER BY vo.sku
  ) AS variants,

  -- 🔥 sizes (distinct + ordered)
  COALESCE(
    (
      SELECT jsonb_agg(value ORDER BY position)
      FROM dedup_option_values d
      WHERE d.product_id = p.id
        AND d.option_name = 'size'
    ),
    '[]'::jsonb
  ) AS sizes,

  -- 🔥 finishes (distinct + ordered)
  COALESCE(
    (
      SELECT jsonb_agg(value ORDER BY position)
      FROM dedup_option_values d
      WHERE d.product_id = p.id
        AND d.option_name = 'finish'
    ),
    '[]'::jsonb
  ) AS finishes

FROM bizion.public.products p

left JOIN bizion.public.product_variants pv 
  ON pv.product_id = p.id

left JOIN variant_options vo 
  ON vo.variant_id = pv.id

left JOIN bizion.public.categories c 
  ON p.category_id = c.id

left JOIN bizion.public.brands b 
  ON p.brand_id = b.id

left JOIN bizion.public.units u 
  ON p.unit_id = u.id

LEFT JOIN bizion.public.product_images i 
  ON p.image_id = i.id

-- ⚡ IMPORTANT: filter early
WHERE p.id = ${id}

GROUP BY
  p.id,
  p.model,
  p.image_id,
  c.name,
  b.name,
  p.size_type,
  u.symbol;
  `)

    return result[0]
  },

  async getCatalogProducts() {
    return "all"
  }


};
