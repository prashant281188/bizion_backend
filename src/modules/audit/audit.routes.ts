import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { auditController } from "./audit.controller";
import { listAuditSchema } from "./audit.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("audit:read"),
  validateSchema(listAuditSchema, "query"),
  auditController.list
);

router.get("/:id", authMiddleware, requirePermission("audit:read"), auditController.getById);

export default router;
