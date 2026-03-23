import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { brands, carousel, categories, products, variantRates } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { ListProductsInput } from "./public.schema";

/* =====================================================
   HELPERS
===================================================== */

/** Aggregate distinct option values per option name across all variants */
function buildOptions(variants: any[]): { name: string; values: string[] }[] {
  const map: Record<string, Set<string>> = {};

  for (const variant of variants) {
    for (const ov of variant.optionValues) {
      const name: string = ov.optionValue?.option?.optionName;
      const value: string = ov.optionValue?.optionValue;
      if (!name || !value) continue;
      if (!map[name]) map[name] = new Set();
      map[name].add(value);
    }
  }

  return Object.entries(map).map(([name, values]) => ({
    name,
    values: Array.from(values).sort(),
  }));
}

/** Pick the latest rate entry for a variant */
function latestRate(rates: any[]) {
  if (!rates.length) return null;
  return rates.reduce((a, b) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? a : b
  );
}

/* =====================================================
   SERVICE
===================================================== */

export const publicService = {
  /* ===== CATEGORIES ===== */

  async getActiveCategories() {
    const rows = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: asc(categories.categoryName),
      columns: { id: true, categoryName: true, parentId: true, description: true },
    });

    // Build hierarchy: parent → children
    const map: Record<string, any> = {};
    for (const row of rows) map[row.id] = { ...row, children: [] };

    const roots: any[] = [];
    for (const row of rows) {
      if (row.parentId && map[row.parentId]) {
        map[row.parentId].children.push(map[row.id]);
      } else {
        roots.push(map[row.id]);
      }
    }

    return roots;
  },

  /* ===== BRANDS ===== */

  async getBrands() {
    return db.select().from(brands).orderBy(asc(brands.brandName));
  },

  /* ===== PRODUCT LISTING ===== */

  async getProducts({ page = 1, limit = 20, search, categoryId, brandId, sort = "model_asc" }: ListProductsInput) {
    const offset = (page - 1) * limit;

    const conditions = [eq(products.isDeleted, false), eq(products.isActive, true)];
    if (search) conditions.push(ilike(products.model, `%${search}%`));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (brandId) conditions.push(eq(products.brandId, brandId));

    const where = and(...conditions);

    const orderBy =
      sort === "model_desc" ? [desc(products.model)]
      : sort === "newest"   ? [desc(products.createdAt)]
      :                       [asc(products.model)];

    const [items, [{ count }]] = await Promise.all([
      db.query.products.findMany({
        where,
        limit,
        offset,
        orderBy,
        columns: {
          id: true,
          model: true,
          metal: true,
          shortDescription: true,
          sizeType: true,
          isFeatured: true,
          isNew: true,
          createdAt: true,
        },
        with: {
          brand: { columns: { id: true, brandName: true, brandLogo: true } },
          category: { columns: { id: true, categoryName: true } },
          image: { columns: { path: true } },
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(where),
    ]);

    return {
      items,
      meta: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
    };
  },

  /* ===== PRODUCT DETAIL ===== */

  async getProductDetail(id: string) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isDeleted, false), eq(products.isActive, true)),
      columns: {
        id: true,
        model: true,
        metal: true,
        shortDescription: true,
        description: true,
        sizeType: true,
        status: true,
        isFeatured: true,
        isNew: true,
      },
      with: {
        brand: { columns: { id: true, brandName: true, brandLogo: true } },
        category: { columns: { id: true, categoryName: true } },
        hsn: { columns: { hsnCode: true } },
        unit: { columns: { unitName: true, unitSymbol: true } },
        image: { columns: { path: true } },
        variants: {
          columns: { id: true, sku: true, packing: true },
          with: {
            rates: {
              columns: { mrp: true, saleRate: true, purchaseRate: true, createdAt: true },
              orderBy: (r, { desc }) => [desc(r.createdAt)],
            },
            optionValues: {
              columns: {},
              with: {
                optionValue: {
                  columns: { id: true, optionValue: true, position: true },
                  with: { option: { columns: { optionName: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!product) throw new AppError("Product not found", 404);

    // Transform variants into a clean shape
    const variants = product.variants.map((v) => {
      const rate = latestRate(v.rates);
      const optionObj: Record<string, string> = {};
      for (const ov of v.optionValues) {
        if (ov.optionValue?.option?.optionName && ov.optionValue?.optionValue) {
          optionObj[ov.optionValue.option.optionName] = ov.optionValue.optionValue;
        }
      }
      return {
        id: v.id,
        sku: v.sku,
        packing: v.packing,
        mrp: rate?.mrp ?? null,
        saleRate: rate?.saleRate ?? null,
        purchaseRate: rate?.purchaseRate ?? null,
        options: optionObj,
      };
    });

    const { variants: _, ...productData } = product;

    return {
      ...productData,
      options: buildOptions(product.variants),
      variants,
    };
  },

  /* ===== CATALOG (lightweight full listing for catalog pages) ===== */

  async getCatalog() {
    const rows = await db.query.products.findMany({
      where: and(eq(products.isDeleted, false), eq(products.isActive, true)),
      orderBy: [asc(products.categoryId), asc(products.model)],
      columns: { id: true, model: true, metal: true, sizeType: true, slug: true },
      with: {
        brand: { columns: { brandName: true } },
        category: { columns: { categoryName: true } },
        image: { columns: { path: true } },
        variants: {
          columns: { sku: true, packing: true },
          with: {
            rates: {
              columns: { mrp: true, saleRate: true },
              orderBy: (r, { desc }) => [desc(r.createdAt)],
            },
          },
        },
      },
    });

    // Group by category
    const grouped: Record<string, { categoryName: string; products: any[] }> = {};
    for (const p of rows) {
      const key = p.category?.categoryName ?? "Uncategorised";
      if (!grouped[key]) grouped[key] = { categoryName: key, products: [] };

      const { category: _, variants, ...rest } = p;
      grouped[key].products.push({
        ...rest,
        variants: variants.map((v) => ({
          sku: v.sku,
          packing: v.packing,
          mrp: v.rates[0]?.mrp ?? null,
          saleRate: v.rates[0]?.saleRate ?? null,
        })),
      });
    }

    return Object.values(grouped);
  },

  /* ===== CAROUSEL ===== */

  async getCarouselData() {
    return db.query.carousel.findMany({
      where: eq(carousel.isActive, true),
    });
  },
};
