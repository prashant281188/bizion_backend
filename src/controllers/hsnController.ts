import { Request, Response } from "express";
import { hsnModel } from '../model/hsn'
import { hsnSchema, hsnUpdateSchema } from "../schema/hsn";

export const hsnController = {

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
            const data = await hsnModel.getAll({ filters, offset, limit: limitNum });
            return res.success("Fetched Successfully", data)
        }
        catch (err) {

            return res.error("Internal server error", 500, err)
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await hsnModel.getByID(id);
        if (!data) return res.error("Not found", 404)
        return res.success("Fetched", data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await hsnModel.delete(id)
        if (!data) return res.error("not found", 404)
        return res.success("deleted successfully", data)
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = hsnSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error('Validation error', 404, parsedData.error.flatten().fieldErrors)
        // Now safely access the validated data

        const { hsnCode, hsnDescription } = parsedData.data

        // Check for duplicate

        const duplicate = await hsnModel.getByCode(hsnCode)

        if (duplicate)
            return res.error("Dulicate entry", 409)

        try {

            const newData = await hsnModel.create(parsedData.data);
            return res.success("Created Successfully", newData)
        }
        catch (err) {
            console.error("DB error:", err);
            return res.error("Internal server error", 500, err)
        }

    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = hsnUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.error('Validation error', 400, parsedData.error.flatten().fieldErrors)

        const existing = await hsnModel.getByID(id);
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await hsnModel.getByCode(parsedData.data.hsnCode);
        if (duplicate) {
            return res.error("Duplicate entry", 409)
        }
        const updatedData = await hsnModel.update({ ...parsedData.data, id });
        if (!updatedData) return res.error('not found', 404)
        return res.status(201).json(updatedData)
    },
}
