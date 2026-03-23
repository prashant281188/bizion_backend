import { Router } from "express";
import { publicController } from "./public.controller";
import { validateSchema } from "../../middlewares/validateSchema";
import { listProductsSchema } from "./public.schema";

const router = Router();

router.get("/carousel", publicController.getCarouselData);
router.get("/categories", publicController.getCategories);
router.get("/brands", publicController.getBrands);
router.get("/products/catalog", publicController.getCatalog);
router.get("/products/:id", publicController.getProductDetail);
router.get("/products", validateSchema(listProductsSchema, "query"), publicController.getProducts);

export default router;
