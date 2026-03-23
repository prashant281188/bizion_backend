import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddelware";
import { carouselService } from "./carousel.service";
import { logAudit } from "../../services/audit.service";

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
      const data = await carouselService.create(req.body);
      await logAudit({ userId: req.user!.userId, action: "carousel:create", entity: "carousel", entityId: data.id });
      res.status(201).json({ success: true, message: "Carousel item created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await carouselService.update(req.params.id, req.body);
      await logAudit({ userId: req.user!.userId, action: "carousel:update", entity: "carousel", entityId: data.id });
      res.json({ success: true, message: "Carousel item updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await carouselService.remove(req.params.id);
      await logAudit({ userId: req.user!.userId, action: "carousel:delete", entity: "carousel", entityId: req.params.id });
      res.json({ success: true, message: "Carousel item deleted" });
    } catch (err) { next(err); }
  },
};
