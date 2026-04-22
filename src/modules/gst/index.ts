import { Router } from "express";
import gstGroupRoutes from "./gstGroup.routes";
import gstRateRoutes from "./gstRate.routes";

const router = Router();

router.use("/groups", gstGroupRoutes);
router.use("/rates", gstRateRoutes);

export default router;
