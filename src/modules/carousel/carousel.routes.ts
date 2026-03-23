import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { carouselController } from "./carousel.controller";
import { createCarouselSchema, updateCarouselSchema } from "./carousel.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("carousel:read"), carouselController.list);
router.get("/:id", authMiddleware, requirePermission("carousel:read"), carouselController.getById);
router.post("/", authMiddleware, requirePermission("carousel:create"), validateSchema(createCarouselSchema), carouselController.create);
router.patch("/:id", authMiddleware, requirePermission("carousel:update"), validateSchema(updateCarouselSchema), carouselController.update);
router.delete("/:id", authMiddleware, requirePermission("carousel:delete"), carouselController.remove);

export default router;
