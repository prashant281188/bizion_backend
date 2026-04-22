import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { gstGroupController } from "./gstGroup.controller";
import { createGstGroupSchema, listGstGroupSchema, updateGstGroupSchema } from "./gstGroup.schema";

const router = Router();

router.get("/", validateSchema(listGstGroupSchema, "query"), gstGroupController.list);
router.get("/:id", authMiddleware, requirePermission("gst:read"), gstGroupController.getById);
router.post("/", authMiddleware, requirePermission("gst:create"), validateSchema(createGstGroupSchema), gstGroupController.create);
router.patch("/:id", authMiddleware, requirePermission("gst:update"), validateSchema(updateGstGroupSchema), gstGroupController.update);
router.delete("/:id", authMiddleware, requirePermission("gst:delete"), gstGroupController.remove);

export default router;
