import { Router } from "express";
import { transportController } from "../controllers/transportController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', transportController.getAll)
router.get('/:id',validateId(), transportController.getByID)
router.delete('/:id',validateId(), transportController.delete)
router.post('/', transportController.create)
router.put('/:id',validateId(), transportController.update)

export default router