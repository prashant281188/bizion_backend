import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddelware";
import { requirePermission } from "../../../middlewares/requirePermission";
import { validateSchema } from "../../../middlewares/validateSchema";
import { gstRateController } from "./gstRate.controller";
import { createGstRateSchema, listGstRateSchema, updateGstRateSchema } from "./gstRate.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("gst:read"), validateSchema(listGstRateSchema, "query"), gstRateController.list);
router.get("/:id", authMiddleware, requirePermission("gst:read"), gstRateController.getById);
router.post("/", authMiddleware, requirePermission("gst:create"), validateSchema(createGstRateSchema), gstRateController.create);
router.patch("/:id", authMiddleware, requirePermission("gst:update"), validateSchema(updateGstRateSchema), gstRateController.update);
router.delete("/:id", authMiddleware, requirePermission("gst:delete"), gstRateController.remove);

export default router;
