import { Router } from "express";
import { groupController } from "../controllers/groupController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', groupController.getAll)
router.get('/:id', validateId(), groupController.getByID)
router.delete('/:id', validateId(), groupController.delete)
router.post('/', groupController.create)
router.put('/:id', validateId(), groupController.update)

export default router