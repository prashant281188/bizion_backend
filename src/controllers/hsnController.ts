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
            res.json(data)
        }
        catch (error) {

            res.status(400).json({
                message: ""
            })
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await hsnModel.getByID(id);
        if (!data) return res.status(404).json({
            messagae: "Not found"
        })
        res.json(data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await hsnModel.delete(id)
        if (!data) return res.status(404).send("not found")
        res.status(204).send("deleted successfully")
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = hsnSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })
        // Now safely access the validated data

        const { hsnCode, hsnDescription } = parsedData.data

        // Check for duplicate

        const duplicate = await hsnModel.getByCode(hsnCode)

        if (duplicate)
            return res.status(400).json({
                message: "Dulicate entry"
            })

        try {

            const newData = await hsnModel.create(parsedData.data);
            res.status(201).json(newData)
        }
        catch (err) {
            console.error("DB error:", err);
            return res.status(500).json({
                message: "Internal server error",
                errors: err
            });
        }

    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = hsnUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })

        const existing = await hsnModel.getByID(id);
        if (!existing)
            return res.status(404).json({
                message: "Record not found by this id"
            })

        const duplicate = await hsnModel.getByCode(parsedData.data.hsnCode);
        if (duplicate) {
            return res.status(409).json({
                message: "Duplicate entry"
            })
        }
        const updatedData = await hsnModel.update({ ...parsedData.data, id });
        if (!updatedData) return res.status(404).send('not found')
        res.status(201).json(updatedData)
    },
}
