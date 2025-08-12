import { Router } from "express";
import { productController } from "../controllers/productController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', productController.getAll)
router.get('/:id', validateId(), productController.getByID)
router.delete('/:id', validateId(), productController.delete)
router.post('/', productController.create)
router.put('/:id', validateId(), productController.update)

export default router