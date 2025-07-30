import { Router } from "express";
import { Controller } from "../controllers/groupController";

const router = Router();


router.get('/', Controller.getAll)
router.get('/:id', Controller.getByID)
router.delete('/:id', Controller.delete)
router.post('/', Controller.create)
router.put('/:id', Controller.update)

export default router