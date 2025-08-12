import { Request, Response } from "express";
import { transportModel } from '../model/transport'
import { transportSchema, transportUpdateSchema } from "../schema/transport";
import { buildMeta, getPagination } from "../utils/paginationUtil";

export const transportController = {
    async getAll(req: Request, res: Response) {
        const { search = '' } = req.query
        const { page, limit, offset } = getPagination(req.query);
        try {
            const filters = {
                search: String(search)
            }
            const [data, total] = await Promise.all([
                transportModel.getAll({ filters, offset, limit }),
                transportModel.count({ filters })
            ]);
            if (!data)
                return res.error("Not Found", 404)
            return res.success(
                "Fetched Successfully",
                data,
                buildMeta(page, limit, total)
            )
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await transportModel.getByID(id);
        if (!data)
            return res.error("Not Found", 404)
        return res.success("Fetched successfully", data)
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id
        const data = await transportModel.delete(id)
        if (!data)
            return res.error("not found", 404)
        return res.success("Deleted Successfully", data)
    },

    async create(req: Request, res: Response) {
        // First, validate the input
        const parsedData = transportSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error('Validation error', 400, parsedData.error.flatten().fieldErrors)
        // Now safely access the validated data

        const { gstin } = parsedData.data
        // Check for duplicate
        const duplicate = await transportModel.getByGstin(gstin!)
        if (duplicate)
            return res.error("Dulicate entry", 409)

        try {
            const newData = await transportModel.create(parsedData.data);
            return res.status(201).json(newData)
        }
        catch (err) {
            return res.error("Internal server error", 500, err);
        }
    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = transportUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.error('Validation error', 409, parsedData.error.flatten().fieldErrors)

        const existing = await transportModel.getByID(id);
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await transportModel.getByGstin(parsedData.data.gstin!);
        if (duplicate) {
            return res.error("Duplicate entry", 409)
        }
        const updatedData = await transportModel.update({ ...parsedData.data, id });
        if (!updatedData)
            return res.error('Not Found', 404)
        return res.success("Updated Successfully", updatedData)
    },
}
