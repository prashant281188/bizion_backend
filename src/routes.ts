import { Router, Request, Response } from "express";

import authRoutes from "./modules/auth";
import userRoutes from "./modules/user";
import categoryRoutes from "./modules/category";
import productRoutes from "./modules/product";
import variantRoutes from "./modules/variant";
import hsnRoutes from "./modules/hsn";
import gstRoutes from "./modules/gst";
import brandRoutes from "./modules/brand";
import unitRoutes from "./modules/unit";
import optionRoutes from "./modules/option";
import carouselRoutes from "./modules/carousel";
import roleRoutes from "./modules/role";
import imageRoutes from "./modules/image";
import storeRoutes from "./modules/store";
import partyRoutes from "./modules/party";
import orderRoutes from "./modules/order";
import inventoryRoutes from "./modules/inventory";
import dispatchRoutes from "./modules/dispatch";
import purchaseReceiptRoutes from "./modules/purchaseReceipt";

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
v1.use("/store", storeRoutes);

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

/* -------- PARTIES -------- */
v1.use("/parties", partyRoutes);

/* -------- ORDERS -------- */
v1.use("/orders", orderRoutes);

/* -------- INVENTORY -------- */
v1.use("/inventory", inventoryRoutes);

/* -------- DISPATCH -------- */
v1.use("/dispatches", dispatchRoutes);

/* -------- PURCHASE RECEIPTS -------- */
v1.use("/purchase-receipts", purchaseReceiptRoutes);

/* ================= 404 HANDLER ================= */

router.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default router;
