import { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { carouselService } from "./carousel.service";
import { logAudit } from "../../services/audit.service";
import { AppError } from "../../middlewares/errorHandler";
import { deleteFromS3, getS3Url, uploadToS3 } from "../../services/s3.service";
import { createCarouselSchema, updateCarouselSchema } from "./carousel.schema";
import { db } from "../../config/db";
import { carousel } from "../../db/schema";

export const carouselController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await carouselService.list();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await carouselService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError("No image file provided", 400);

      const { key } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, "carousel");

      const rawBody: Record<string, any> = { ...req.body };
      if (rawBody.isActive === "true") rawBody.isActive = true;
      else if (rawBody.isActive === "false") rawBody.isActive = false;

      const parsed = createCarouselSchema.parse({ ...rawBody, image: key });

      const data = await carouselService.create(parsed);

      await logAudit({ userId: req.user!.userId, action: "carousel:create", entity: "carousel", entityId: data.id });
      res.status(201).json({ success: true, message: "Carousel item created", data: { ...data, imageUrl: getS3Url(key) } });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rawBody: Record<string, any> = { ...req.body };
      if (rawBody.isActive === "true") rawBody.isActive = true;
      else if (rawBody.isActive === "false") rawBody.isActive = false;

      // Replace image if a new file was provided
      if (req.file) {
        const existing = await db.query.carousel.findFirst({
          where: eq(carousel.id, req.params.id),
          columns: { id: true, image: true },
        });
        if (!existing) throw new AppError("Carousel item not found", 404);

        const { key } = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, "carousel");

        // Delete old image from S3
        if (existing.image) await deleteFromS3(existing.image);

        rawBody.image = key;
      }

      const parsed = updateCarouselSchema.parse(rawBody);
      const data = await carouselService.update(req.params.id, parsed);

      await logAudit({ userId: req.user!.userId, action: "carousel:update", entity: "carousel", entityId: data.id });
      res.json({ success: true, message: "Carousel item updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Delete image from S3 before removing the record
      const existing = await db.query.carousel.findFirst({
        where: eq(carousel.id, req.params.id),
        columns: { image: true },
      });
      if (existing?.image) await deleteFromS3(existing.image);

      await carouselService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "carousel:delete", entity: "carousel", entityId: req.params.id });
      res.json({ success: true, message: "Carousel item deleted" });
    } catch (err) { next(err); }
  },
};
