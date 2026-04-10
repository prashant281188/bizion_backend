import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { uploadImages } from "../../middlewares/upload";
import { businessController } from "./business.controller";
import { createBusinessSchema, listBusinessSchema, updateBusinessSchema } from "./business.schema";

const router = Router();

// logo (field: "logo") and signature (field: "signature") are optional image uploads
const uploadBusinessFiles = uploadImages.fields([
  { name: "logo",      maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

router.get(
  "/",
  authMiddleware,
  requirePermission("business:read"),
  validateSchema(listBusinessSchema, "query"),
  businessController.list,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("business:read"),
  businessController.getById,
);

router.post(
  "/",
  authMiddleware,
  requirePermission("business:create"),
  uploadBusinessFiles,
  validateSchema(createBusinessSchema),
  businessController.create,
);

router.patch(
  "/:id",
  authMiddleware,
  requirePermission("business:update"),
  uploadBusinessFiles,
  validateSchema(updateBusinessSchema),
  businessController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("business:delete"),
  businessController.remove,
);

export default router;
