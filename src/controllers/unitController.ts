import { Request, Response } from "express";
import { unitModel } from '../model/unit'
import { unitSchema, unitUpdateSchema } from "../schema/unit";


export const unitController = {

    async getAll(req: Request, res: Response) {

        const {
            search = '',
            page = 1,
            limit = 10
        } = req.query

        const pageNum = Number(page)
        const limitNum = Number(limit)
        const offset = (pageNum - 1) * limitNum

        try {
            const filters = {
                search: String(search)
            }
            const [data, total] = await Promise.all([unitModel.getAll({ filters, offset, limit: limitNum }), unitModel.count({ filters })]);
            return res.success(
                "Fetched Successfully",
                data,
                {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            )
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await unitModel.getByID(id);
        if (!data) return res.error("Not Found", 404)
        return res.success("Fetched", data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await unitModel.delete(id)
        if (!data) return res.error("Not Found", 404)
        return res.success("deleted successfully", data)
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = unitSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation error", 400, parsedData.error.flatten().fieldErrors)
        // Now safely access the validated data

        const { unitLongName } = parsedData.data

        // Check for duplicate


        if (unitLongName) {
            const duplicate = await unitModel.getByName(unitLongName!)

            if (duplicate)
                return res.error("Duplicate Entry", 409)
        }

        try {

            const newData = await unitModel.create(parsedData.data);
            return res.success("Created Successfully", newData)
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }

    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = unitUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)

        const existing = await unitModel.getByID(id);
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await unitModel.getByName(parsedData.data.unitLongName!);
        if (duplicate) {
            return res.error("Duplicate Entry", 409)
        }
        const updatedData = await unitModel.update({ ...parsedData.data, id });
        if (!updatedData) return res.error("Not Found", 404)
        return res.success("Updated Successfully", updatedData)
    },
}
