import { Request, Response } from "express";
import { taxModel } from '../model/tax'
import { taxSchema, taxUpdateSchema } from "../schema/tax";

export const taxController = {

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
            const [data, total] = await Promise.all([
                taxModel.getAll({ filters, offset, limit: limitNum }),
                taxModel.count({ filters })
            ])
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
        const data = await taxModel.getByID(id);
        if (!data)
            return res.error("Not found", 404)
        return res.success("Feched Successfully", data)
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id
        const data = await taxModel.delete(id)
        if (!data)
            return res.error("Not Found", 404)
        return res.success("Deleted Successfully", data)
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = taxSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)
        // Now safely access the validated data
        const { taxName } = parsedData.data
        // Check for duplicate
        const duplicate = await taxModel.getByName(taxName)
        if (duplicate)
            return res.error("Duplicate Entry", 409)
        try {
            const newData = await taxModel.create(parsedData.data);
            return res.success("Created Successfully", newData)
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }
    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = taxUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)

        const existing = await taxModel.getByID(id);
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await taxModel.getByName(parsedData.data.taxName);
        if (duplicate) {
            return res.error("Duplicate Entry", 409)
        }
        const updatedData = await taxModel.update({ ...parsedData.data, id });
        if (!updatedData)
            return res.error('Not Found', 404)
        return res.success("Updated Successfully", updatedData)
    },
}
