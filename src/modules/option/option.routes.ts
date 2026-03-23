import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddelware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { optionController } from "./option.controller";
import {
  createOptionSchema,
  listOptionSchema,
  updateOptionSchema,
  createOptionValueSchema,
  updateOptionValueSchema,
} from "./option.schema";

const router = Router();

/* ===== OPTIONS ===== */
router.get("/", authMiddleware, requirePermission("option:read"), validateSchema(listOptionSchema, "query"), optionController.list);
router.get("/:id", authMiddleware, requirePermission("option:read"), optionController.getById);
router.post("/", authMiddleware, requirePermission("option:create"), validateSchema(createOptionSchema), optionController.create);
router.patch("/:id", authMiddleware, requirePermission("option:update"), validateSchema(updateOptionSchema), optionController.update);
router.delete("/:id", authMiddleware, requirePermission("option:delete"), optionController.remove);

/* ===== OPTION VALUES ===== */
router.post("/:id/values", authMiddleware, requirePermission("option:create"), validateSchema(createOptionValueSchema), optionController.addValue);
router.patch("/:id/values/:valueId", authMiddleware, requirePermission("option:update"), validateSchema(updateOptionValueSchema), optionController.updateValue);
router.delete("/:id/values/:valueId", authMiddleware, requirePermission("option:delete"), optionController.removeValue);

export default router;
