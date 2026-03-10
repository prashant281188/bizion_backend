import { Router } from "express";
import { gstGroupController } from "./gstGroup.controller";


const router = Router();

router.get("/gstGroups", gstGroupController.getGstGroups)
router.get("/gstGroup/:id", gstGroupController.getGstGroupById)


export default router;