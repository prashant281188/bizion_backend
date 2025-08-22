import { Router } from "express";
import { productController } from "../controllers/productController";
import { validateId } from "../middlewares/validateId";
import { uploadImages } from "../middlewares/upload";

const router = Router();


router.get('/', productController.getAll)
router.get('/:id', validateId(), productController.getByID)
router.delete('/:id', validateId(), productController.delete)
router.post('/', uploadImages.array("files",5), productController.create)
router.put('/:id', validateId(), productController.update)

export default router