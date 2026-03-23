import { Router } from "express";
import gstGroupRoutes from "./gstGroup/gstGroupRoutes";
import gstRateRoutes from "./gstRate/gstRate.routes";

const router = Router();

router.use("/groups", gstGroupRoutes);
router.use("/rates", gstRateRoutes);

export default router;
