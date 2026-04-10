import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { dispatchController } from "./dispatch.controller";
import { createDispatchSchema, listDispatchSchema, updateDispatchSchema } from "./dispatch.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("dispatch:read"),
  validateSchema(listDispatchSchema, "query"),
  dispatchController.list
);
router.get(
  "/:id",
  authMiddleware,
  requirePermission("dispatch:read"),
  dispatchController.getById
);
router.post(
  "/",
  authMiddleware,
  requirePermission("dispatch:create"),
  validateSchema(createDispatchSchema),
  dispatchController.create
);
router.patch(
  "/:id",
  authMiddleware,
  requirePermission("dispatch:update"),
  validateSchema(updateDispatchSchema),
  dispatchController.update
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("dispatch:delete"),
  dispatchController.remove
);

export default router;
