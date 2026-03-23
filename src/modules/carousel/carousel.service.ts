import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { carousel } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";
import { CreateCarouselInput, UpdateCarouselInput } from "./carousel.schema";

export const carouselService = {
  async list() {
    return db.select().from(carousel);
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
