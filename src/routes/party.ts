import { Router } from "express";
import { partyController } from "../controllers/partyController";
import { validateId } from "../middlewares/validateId";

const router = Router();


router.get('/', partyController.getAll)
router.get('/:id', validateId(), partyController.getByID)
router.delete('/:id', validateId(), partyController.delete)
router.post('/', partyController.create)
router.put('/:id', validateId(), partyController.update)

export default router