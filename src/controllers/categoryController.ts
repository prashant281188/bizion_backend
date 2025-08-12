import { Request, Response } from "express";
import { categoryModel } from '../model/category'
import { categorySchema, categoryUpdateSchema } from "../schema/category";

export const categoryController = {

    async getAll(req: Request, res: Response) {
        const {
            page = 1,
            limit = 10,
            search = '',

        } = req.query

        const pageNum = Number(page)
        const limitNum = Number(limit)
        const offset = (pageNum - 1) * limitNum

        try {
            const filters = {
                search: String(search),
            };


            const [data, total] = await Promise.all([await categoryModel.getAll({ filters, offset, limit: limitNum }),
            await categoryModel.count({ filters })
            ]);
            if (!data) return res.status(404).send('not found any')
            return res.json({
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

        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await categoryModel.getByID(id);
        if (!data) return res.status(404).json({
            message: "Not found "
        })
        res.json(data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await categoryModel.delete(id)
        if (!data) return res.status(404).send("not found")
        res.status(204).send("deleted successfully")

    },

    async create(req: Request, res: Response) {
        // First, validate the input
        const parsedData = categorySchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            });
        }

        // Now safely access the validated data
        const { categoryName, categoryDescription } = parsedData.data;

        // Check for duplicate
        const duplicate = await categoryModel.getByName(categoryName);

        if (duplicate) {
            return res.status(409).json({ // Use 409 Conflict for duplicate
                message: "Duplicate entry"
            });
        }

        // Create new entry
        try {
            const newData = await categoryModel.create(parsedData.data);
            return res.status(201).json(newData);
        } catch (err) {
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

        // validate the input
        const parsedData = categorySchema.safeParse({ ...body });

        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })


        const existing = await categoryModel.getByID(id)
        if (!existing)
            return res.status(404).json({
                message: "Record not found by this id"
            })

        // Check for duplicate
        const duplicate = await categoryModel.getByName(parsedData.data.categoryName.trim());
        if (duplicate) {
            return res.status(409).json({ // Use 409 Conflict for duplicate
                message: "Duplicate entry",

            });
        }

        const updateData = await categoryModel.update({ ...parsedData.data, id });

        if (!updateData) return res.status(404).send('not found')
        res.status(201).json(updateData)
    },

    async patch(req: Request, res: Response) {
        const id = req.params.id
        const patchData = categoryUpdateSchema.partial().safeParse(req.body);
        if (!patchData.success)
            return res.status(400).json({
                message: 'validation error',
                errors: patchData.error.flatten().fieldErrors
            })

        const updateData = await categoryModel.update({ ...patchData.data, id });
        if (!updateData) return res.status(404).send('not found')
        res.status(201).json(updateData)


    }
}
