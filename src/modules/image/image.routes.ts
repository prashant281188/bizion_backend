import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { uploadImages } from "../../middlewares/upload";
import { imageController } from "./image.controller";

const router = Router();

/* ===== PRODUCT IMAGES ===== */
router.post("/products/:id/image", authMiddleware, requirePermission("product:update"), uploadImages.single("image"), imageController.uploadProductImage);
router.delete("/products/:id/image", authMiddleware, requirePermission("product:update"), imageController.deleteProductImage);

/* ===== VARIANT IMAGES ===== */
router.post("/variants/:id/images", authMiddleware, requirePermission("product:update"), uploadImages.single("image"), imageController.uploadVariantImage);
router.delete("/variants/:id/images/:imageId", authMiddleware, requirePermission("product:update"), imageController.deleteVariantImage);


export default router;
