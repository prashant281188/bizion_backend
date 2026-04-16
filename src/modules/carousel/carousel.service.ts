import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db";
import { carousel } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateCarouselInput, ListCarouselInput, UpdateCarouselInput } from "./carousel.schema";

export const carouselService = {
  async list({ page, limit, search }: ListCarouselInput = {}) {
    const where = search
      ? or(ilike(carousel.title, `%${search}%`), ilike(carousel.description, `%${search}%`))
      : undefined;

    const [items, [{ count }]] = await Promise.all([
      limit !== undefined
        ? db.select().from(carousel).where(where).limit(limit).offset(((page ?? 1) - 1) * limit)
        : db.select().from(carousel).where(where),
      db.select({ count: sql<number>`count(*)` }).from(carousel).where(where),
    ]);

    const total = Number(count);
    const resolvedPage = page ?? 1;
    const resolvedLimit = limit ?? total;
    return {
      items,
      meta: { page: resolvedPage, limit: resolvedLimit, total, totalPages: limit ? Math.ceil(total / limit) : 1 },
    };
  },

  async getById(id: string) {
    const item = await db.query.carousel.findFirst({ where: eq(carousel.id, id) });
    if (!item) throw new AppError("Carousel item not found", 404);
    return item;
  },

  async create(data: CreateCarouselInput) {
    const [item] = await db.insert(carousel).values(data).returning();
    return item;
  },

  async update(id: string, data: UpdateCarouselInput) {
    const [updated] = await db.update(carousel).set(data).where(eq(carousel.id, id)).returning();
    if (!updated) throw new AppError("Carousel item not found", 404);
    return updated;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(carousel).where(eq(carousel.id, id)).returning({ id: carousel.id });
    if (!deleted) throw new AppError("Carousel item not found", 404);
  },
};
