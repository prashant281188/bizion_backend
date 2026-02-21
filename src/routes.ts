import { Router, Request, Response } from "express";

import authRoutes from "./modules/auth/auth.routes";
import categoryRoutes from "./modules/category/category.routes";
import publicRoutes from "./modules/public/public.routes"


const router = Router();

/* ================= HEALTH CHECK ================= */

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

/* ================= API VERSIONING ================= */

const v1 = Router();

/* ================= REGISTER VERSION ================= */

router.use("/v1", v1);

v1.use("/public", publicRoutes)

/* -------- AUTH -------- */
v1.use("/auth", authRoutes);

// /* -------- USERS -------- */
// v1.use("/users", userRoutes);

/* -------- CATEGORIES -------- */
v1.use("/categories", categoryRoutes);

// /* -------- PRODUCTS -------- */
// v1.use("/products", productRoutes);

/* ================= 404 HANDLER ================= */

router.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default router;
