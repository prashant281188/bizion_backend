import { Router } from "express";
import { requirePermission } from "../../middlewares/requirePermission";
import { validateSchema } from "../../middlewares/validateSchema";

import { authMiddleware } from "../../middlewares/authMiddelware";
import { productController } from "./product.controller";

const router = Router();

/* ================= LIST ================= */

router.get(
  "/",
  authMiddleware,
  productController.list
);

/* ================= GET BY ID ================= */

router.get(
  "/:id",
  authMiddleware,
  requirePermission("product:read"),
  productController.getById
);

// /* ================= CREATE ================= */

// router.post(
//   "/",
//   authMiddleware,
//   validateSchema(createSchema),
//   requirePermission("product:create"),
//   productController.create
// );

// /* ================= UPDATE ================= */

// router.put(
//   "/:id",
//   authMiddleware,
//   validateSchema(updateSchema),
//   requirePermission("product:update"),
//   productController.update
// );

// /* ================= DELETE ================= */

// router.delete(
//   "/:id",
//   authMiddleware,
//   requirePermission("product:delete"),
//   productController.remove
// );

export default router;
