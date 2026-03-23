import { Router, Request, Response } from "express";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import categoryRoutes from "./modules/category/category.routes";
import productRoutes from "./modules/product/product.routes";
import variantRoutes from "./modules/variant/variant.routes";
import hsnRoutes from "./modules/hsn/hsn.routes";
import gstRoutes from "./modules/gst/index";
import brandRoutes from "./modules/brand/brand.routes";
import unitRoutes from "./modules/unit/unit.routes";
import optionRoutes from "./modules/option/option.routes";
import carouselRoutes from "./modules/carousel/carousel.routes";
import roleRoutes from "./modules/role/role.routes";
import imageRoutes from "./modules/image/image.routes";
import publicRoutes from "./modules/public/public.routes";

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
router.use("/v1", v1);

/* -------- PUBLIC (no auth) -------- */
v1.use("/public", publicRoutes);

/* -------- AUTH -------- */
v1.use("/auth", authRoutes);

/* -------- USERS -------- */
v1.use("/users", userRoutes);

/* -------- ROLES & PERMISSIONS -------- */
v1.use("/roles", roleRoutes);

/* -------- CATEGORIES -------- */
v1.use("/categories", categoryRoutes);

/* -------- PRODUCTS -------- */
v1.use("/products", productRoutes);

/* -------- VARIANTS -------- */
v1.use("/variants", variantRoutes);

/* -------- HSN -------- */
v1.use("/hsn", hsnRoutes);

/* -------- GST -------- */
v1.use("/gst", gstRoutes);

/* -------- BRANDS -------- */
v1.use("/brands", brandRoutes);

/* -------- UNITS -------- */
v1.use("/units", unitRoutes);

/* -------- OPTIONS -------- */
v1.use("/options", optionRoutes);

/* -------- CAROUSEL -------- */
v1.use("/carousel", carouselRoutes);

/* -------- IMAGES -------- */
v1.use("/images", imageRoutes);

/* ================= 404 HANDLER ================= */

router.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default router;
