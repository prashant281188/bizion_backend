import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { businessService } from "./business.service";
import { logAudit, getClientIp } from "../../services/audit.service";
import { deleteFromS3, uploadToS3 } from "../../services/s3.service";
import { ListBusinessInput } from "./business.schema";

export const businessController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await businessService.list(req.query as unknown as ListBusinessInput);
      res.json({ success: true, data: result.items, meta: result.meta });
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await businessService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      let logoUrl: string | undefined;
      let signatureUrl: string | undefined;

      if (files?.logo?.[0]) {
        const f = files.logo[0];
        const { key } = await uploadToS3(f.buffer, f.originalname, f.mimetype, "business");
        logoUrl = key;
      }
      if (files?.signature?.[0]) {
        const f = files.signature[0];
        const { key } = await uploadToS3(f.buffer, f.originalname, f.mimetype, "business");
        signatureUrl = key;
      }

      const data = await businessService.create({ ...req.body, ...(logoUrl && { logoUrl }), ...(signatureUrl && { signatureUrl }) });
      await logAudit({
        userId: req.user!.userId,
        action: "create",
        entity: "business",
        entityId: data.id,
        entityLabel: data.legalName,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.status(201).json({ success: true, message: "Business created", data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      let logoUrl: string | undefined;
      let signatureUrl: string | undefined;

      const existing = await businessService.getRaw(req.params.id);

      if (files?.logo?.[0]) {
        if (existing.logoUrl) await deleteFromS3(existing.logoUrl);
        const f = files.logo[0];
        const { key } = await uploadToS3(f.buffer, f.originalname, f.mimetype, "business");
        logoUrl = key;
      }
      if (files?.signature?.[0]) {
        if (existing.signatureUrl) await deleteFromS3(existing.signatureUrl);
        const f = files.signature[0];
        const { key } = await uploadToS3(f.buffer, f.originalname, f.mimetype, "business");
        signatureUrl = key;
      }

      const data = await businessService.update(req.params.id, {
        ...req.body,
        ...(logoUrl      && { logoUrl }),
        ...(signatureUrl && { signatureUrl }),
      });
      await logAudit({
        userId: req.user!.userId,
        action: "update",
        entity: "business",
        entityId: data.id,
        entityLabel: data.legalName,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Business updated", data });
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await businessService.getRaw(req.params.id);
      await businessService.remove(req.params.id);
      await logAudit({
        userId: req.user!.userId,
        action: "delete",
        entity: "business",
        entityId: req.params.id,
        entityLabel: existing.legalName,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
      });
      res.json({ success: true, message: "Business deleted" });
    } catch (err) { next(err); }
  },
};
