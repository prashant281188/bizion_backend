import { Router } from "express";
import { storeController } from "./store.controller";
import { validateSchema } from "../../middlewares/validateSchema";
import { listProductsSchema } from "./store.schema";

const router = Router();

router.get("/carousel", storeController.getCarouselData);
router.get("/categories", storeController.getCategories);
router.get("/brands", storeController.getBrands);
router.get("/products/catalog", storeController.getCatalog);
router.get("/catalog/pdf", storeController.getCatalogPdf);
router.get("/products/:id", storeController.getProductDetail);
router.get("/products", validateSchema(listProductsSchema, "query"), storeController.getProducts);

export default router;
