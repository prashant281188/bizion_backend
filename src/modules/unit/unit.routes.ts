import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { unitController } from "./unit.controller";
import { createUnitSchema, listUnitSchema, updateUnitSchema } from "./unit.schema";

const router = Router();

router.get("/", authMiddleware, requirePermission("unit:read"), validateSchema(listUnitSchema, "query"), unitController.list);
router.get("/:id", authMiddleware, requirePermission("unit:read"), unitController.getById);
router.post("/", authMiddleware, requirePermission("unit:create"), validateSchema(createUnitSchema), unitController.create);
router.patch("/:id", authMiddleware, requirePermission("unit:update"), validateSchema(updateUnitSchema), unitController.update);
router.delete("/:id", authMiddleware, requirePermission("unit:delete"), unitController.remove);

export default router;
