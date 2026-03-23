import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { brands, carousel, categories, products, variantRates } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { getS3Url } from "../../services/s3.service";
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

/** Convert a stored S3 key to a full public URL (null-safe) */
function resolveImageUrl(image: { path: string } | null | undefined) {
  if (!image?.path) return null;
  return { url: getS3Url(image.path) };
}

/** Sort variants: Size position first, then Finish position */
function sortVariants(variants: any[]): any[] {
  const pos = (variant: any, optionName: string): number => {
    for (const ov of variant.optionValues) {
      if (ov.optionValue?.option?.optionName === optionName) {
        return ov.optionValue.position ?? 9999;
      }
    }
    return 9999;
  };

  return [...variants].sort((a, b) => {
    const sizeDiff = pos(a, "Size") - pos(b, "Size");
    if (sizeDiff !== 0) return sizeDiff;
    return pos(a, "Finish") - pos(b, "Finish");
  });
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
      items: items.map((p) => ({ ...p, image: resolveImageUrl(p.image) })),
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

    // Transform variants into a clean shape, sorted by Size then Finish
    const variants = sortVariants(product.variants).map((v) => {
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

    const { variants: _, image, ...productData } = product;

    return {
      ...productData,
      image: resolveImageUrl(image),
      options: buildOptions(product.variants),
      variants,
    };
  },

  /* ===== CATALOG: brand → category → product → variants ===== */

  async getCatalog({ brandId, categoryId }: { brandId?: string; categoryId?: string } = {}) {
    const conditions = [eq(products.isDeleted, false), eq(products.isActive, true)];
    if (brandId) conditions.push(eq(products.brandId, brandId));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));

    const rows = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [asc(products.brandId), asc(products.categoryId), asc(products.model)],
      columns: {
        id: true,
        model: true,
        metal: true,
        shortDescription: true,
        description: true,
        sizeType: true,
        slug: true,
        isFeatured: true,
        isNew: true,
        status: true,
      },
      with: {
        brand: { columns: { id: true, brandName: true, brandLogo: true } },
        category: { columns: { id: true, categoryName: true } },
        hsn: { columns: { hsnCode: true, description: true } },
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
                  columns: { optionValue: true, position: true },
                  with: { option: { columns: { optionName: true } } },
                },
              },
            },
          },
        },
      },
    });

    // Group: brand → category → product
    const brandMap = new Map<string, {
      id: string; brandName: string; brandLogo: string | null;
      categories: Map<string, { id: string; categoryName: string; products: any[] }>;
    }>();

    for (const p of rows) {
      const brandId   = p.brand?.id   ?? "__no_brand__";
      const brandName = p.brand?.brandName ?? "Unbranded";
      const catId     = p.category?.id   ?? "__no_cat__";
      const catName   = p.category?.categoryName ?? "Uncategorised";

      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, {
          id: brandId,
          brandName,
          brandLogo: p.brand?.brandLogo ?? null,
          categories: new Map(),
        });
      }

      const brand = brandMap.get(brandId)!;
      if (!brand.categories.has(catId)) {
        brand.categories.set(catId, { id: catId, categoryName: catName, products: [] });
      }

      const { brand: _b, category: _c, variants, image, ...productData } = p;

      const transformedVariants = sortVariants(variants).map((v) => {
        const rate = latestRate(v.rates);
        const options: Record<string, string> = {};
        for (const ov of v.optionValues) {
          if (ov.optionValue?.option?.optionName && ov.optionValue?.optionValue) {
            options[ov.optionValue.option.optionName] = ov.optionValue.optionValue;
          }
        }
        return {
          id: v.id,
          sku: v.sku,
          packing: v.packing,
          mrp: rate?.mrp ?? null,
          saleRate: rate?.saleRate ?? null,
          purchaseRate: rate?.purchaseRate ?? null,
          options,
        };
      });

      brand.categories.get(catId)!.products.push({
        ...productData,
        image: resolveImageUrl(image),
        variants: transformedVariants,
      });
    }

    // Serialize Maps to arrays
    return Array.from(brandMap.values()).map((b) => ({
      id: b.id,
      brandName: b.brandName,
      brandLogo: b.brandLogo,
      categories: Array.from(b.categories.values()),
    }));
  },

  /* ===== CAROUSEL ===== */

  async getCarouselData() {
    return db.query.carousel.findMany({
      where: eq(carousel.isActive, true),
    });
  },
};
