import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { brandController } from "./brand.controller";
import { createBrandSchema, listBrandSchema, updateBrandSchema } from "./brand.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("brand:read"), validateSchema(listBrandSchema, "query"), brandController.list);
router.get("/:id", authMiddleware, requirePermission("brand:read"), brandController.getById);
router.post("/", authMiddleware, requirePermission("brand:create"), validateSchema(createBrandSchema), brandController.create);
router.patch("/:id", authMiddleware, requirePermission("brand:update"), validateSchema(updateBrandSchema), brandController.update);
router.delete("/:id", authMiddleware, requirePermission("brand:delete"), brandController.remove);

export default router;
