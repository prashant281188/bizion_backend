import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { variantController } from "./variant.controller";
import {
  createVariantSchema,
  updateVariantSchema,
  createRateSchema,
  assignOptionValuesSchema,
} from "./variant.schema";

const router = Router();

/* ===== GET / UPDATE / DELETE VARIANT ===== */
router.get("/:id", authMiddleware, requirePermission("product:read"), variantController.getById);
router.patch("/:id", authMiddleware, requirePermission("product:update"), validateSchema(updateVariantSchema), variantController.update);
router.delete("/:id", authMiddleware, requirePermission("product:update"), variantController.remove);

/* ===== ADD VARIANT TO PRODUCT (nested) ===== */
router.post("/product/:productId", authMiddleware, requirePermission("product:update"), validateSchema(createVariantSchema), variantController.create);

/* ===== RATES ===== */
router.post("/:id/rates", authMiddleware, requirePermission("product:update"), validateSchema(createRateSchema), variantController.addRate);
router.delete("/:id/rates/:rateId", authMiddleware, requirePermission("product:update"), variantController.removeRate);

/* ===== OPTION VALUES ===== */
router.put("/:id/options", authMiddleware, requirePermission("product:update"), validateSchema(assignOptionValuesSchema), variantController.assignOptionValues);
router.delete("/:id/options/:optionValueId", authMiddleware, requirePermission("product:update"), variantController.removeOptionValue);

export default router;
