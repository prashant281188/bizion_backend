import { Request, Response } from "express";
import { gstRateService } from "./gstRate.service";

export const gstRateController = {

    async getGstRate(req: Request, res: Response) {

        const data = await gstRateService.getGstRate()

        res.json({
            data,
            success: true,
            message: "Gst Rate fetched successfully"
        })
    },

    async getGstRateById(req: Request, res: Response) {

        const id = req.params.id

        const data = await gstRateService.getGstRateById(id)

        res.json({
            data,
            success: true,
            message: "Gst Rate fetched successfully"
        })
    }
}