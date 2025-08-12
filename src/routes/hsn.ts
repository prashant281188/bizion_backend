import { Router } from "express";
import { hsnController } from "../controllers/hsnController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', hsnController.getAll)
router.get('/:id', validateId(), hsnController.getByID)
router.delete('/:id', validateId(), hsnController.delete)
router.post('/', hsnController.create)
router.put('/:id', validateId(), hsnController.update)

export default router