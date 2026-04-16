import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { uploadImages } from "../../middlewares/upload";
import { carouselController } from "./carousel.controller";
import { listCarouselSchema } from "./carousel.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("carousel:read"), validateSchema(listCarouselSchema, "query"), carouselController.list);
router.get("/:id", authMiddleware, requirePermission("carousel:read"), carouselController.getById);

router.post("/", authMiddleware, requirePermission("carousel:create"), uploadImages.single("image"), carouselController.create);

router.patch("/:id", authMiddleware, requirePermission("carousel:update"), uploadImages.single("image"), carouselController.update);

router.delete("/:id", authMiddleware, requirePermission("carousel:delete"), carouselController.remove);

export default router;
