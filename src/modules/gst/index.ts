import { Router } from "express";
import gstGroupRoutes from "./gstGroup/gstGroup.routes";
import gstRateRoutes from "./gstRate/gstRate.routes";

const router = Router();

router.use("/groups", gstGroupRoutes);
router.use("/rates", gstRateRoutes);

export default router;
