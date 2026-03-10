import { Request, Response } from "express";
import { gstGroupService } from "./gstGroup.service";

export const gstGroupController = {

    async getGstGroups(req: Request, res: Response) {

        const data = await gstGroupService.getGstGroups();
        res.json({
            success: true,
            message: "Gst Group Fetched",
            data
        })
    },

    async getGstGroupById(req: Request, res: Response) {
        const id = req.params.id;

        const data = await gstGroupService.getGstGroupById(id);

        res.json({
            success: true,
            message: "Gst Group Fetched",
            data
        })
    },

    async createGstGroup(req: Request, res:Response){
        const name = req.body

        const group = await gstGroupService.createGstGroup(name)

        res.json()
    }
}