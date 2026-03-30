import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";
import { partyController } from "./party.controller";
import { createPartySchema, listPartySchema, updatePartySchema } from "./party.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermission("party:read"),
  validateSchema(listPartySchema, "query"),
  partyController.list
);
router.get("/:id", authMiddleware, requirePermission("party:read"), partyController.getById);
router.post(
  "/",
  authMiddleware,
  requirePermission("party:create"),
  validateSchema(createPartySchema),
  partyController.create
);
router.patch(
  "/:id",
  authMiddleware,
  requirePermission("party:update"),
  validateSchema(updatePartySchema),
  partyController.update
);
router.delete("/:id", authMiddleware, requirePermission("party:delete"), partyController.remove);

export default router;
