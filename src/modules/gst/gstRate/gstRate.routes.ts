import { Router } from "express";
import { gstRateController } from "./gstRate.controller";

const router = Router();

router.get("/gstRates", gstRateController.getGstRate)
router.get("/gstRate/:id", gstRateController.getGstRateById)

export default router