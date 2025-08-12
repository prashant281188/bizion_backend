import { Router } from "express";
import { taxController } from "../controllers/taxController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', taxController.getAll)
router.get('/:id', validateId(), taxController.getByID)
router.delete('/:id', validateId(), taxController.delete)
router.post('/', taxController.create)
router.put('/:id', validateId(), taxController.update)

export default router