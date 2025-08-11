import { Router } from "express";
import { Controller } from "../controllers/groupController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', Controller.getAll)
router.get('/:id', validateId(), Controller.getByID)
router.delete('/:id', validateId(), Controller.delete)
router.post('/', Controller.create)
router.put('/:id', validateId(), Controller.update)

export default router