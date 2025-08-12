import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { validateId } from "../middlewares/validateId";
import { uploadXls } from "../middlewares/upload";

const router = Router();


router.get('/', categoryController.getAll)
router.get('/export', categoryController.exportExcel)
router.post('/import', uploadXls.single('file'), categoryController.importExcel)
router.post('/', categoryController.create)
router.get('/:id', validateId(), categoryController.getByID)
router.put('/:id', validateId(), categoryController.update)
router.patch('/:id', validateId(), categoryController.patch)
router.delete('/:id', validateId(), categoryController.delete)

export default router