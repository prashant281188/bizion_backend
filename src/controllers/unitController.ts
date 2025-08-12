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
            const [data, total] = await Promise.all([

                unitModel.getAll({ filters, offset, limit: limitNum }),
                unitModel.count({ filters })
            ])
            res.json({
                data: data,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            })
        }
        catch (error) {

            res.status(400).json({
                message: ""
            })
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await unitModel.getByID(id);
        if (!data) return res.status(404).json({
            messagae: "Not found"
        })
        res.json(data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await unitModel.delete(id)
        if (!data) return res.status(404).send("not found")
        res.status(204).send("deleted successfully")
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = unitSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })
        // Now safely access the validated data

        const { unitLongName } = parsedData.data

        // Check for duplicate

        const duplicate = await unitModel.getByName(unitLongName)

        if (duplicate)
            return res.status(400).json({
                message: "Dulicate entry"
            })

        try {

            const newData = await unitModel.create(parsedData.data);
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
        const parsedData = unitUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })

        const existing = await unitModel.getByID(id);
        if (!existing)
            return res.status(404).json({
                message: "Record not found by this id"
            })

        const duplicate = await unitModel.getByName(parsedData.data.unitLongName!);
        if (duplicate) {
            return res.status(409).json({
                message: "Duplicate entry"
            })
        }
        const updatedData = await unitModel.update({ ...parsedData.data, id });
        if (!updatedData) return res.status(404).send('not found')
        res.status(201).json(updatedData)
    },
}
