import { Router } from "express";
import { unitController } from "../controllers/unitController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', unitController.getAll)
router.get('/:id', validateId(), unitController.getByID)
router.delete('/:id', validateId(), unitController.delete)
router.post('/', unitController.create)
router.put('/:id', validateId(), unitController.update)

export default router