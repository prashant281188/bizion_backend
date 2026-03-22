import { Router } from "express";
import { publicController } from "./public.controller";

const router = Router();

router.get("/carousel", publicController.gerCarouselData)
router.get("/categories", publicController.getCategories);
router.get("/brands", publicController.getBrands);
router.get("/products/catalog", publicController.getCatalog)
router.get("/products/:id", publicController.getProductDetail)
router.get("/products", publicController.getProducts)


export default router;
