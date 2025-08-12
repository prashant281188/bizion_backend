import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', categoryController.getAll)
router.get('/:id', validateId(), categoryController.getByID)
router.delete('/:id', validateId(), categoryController.delete)
router.post('/', categoryController.create)
router.put('/:id', validateId(), categoryController.update)
router.patch('/:id', validateId(), categoryController.patch)

export default router