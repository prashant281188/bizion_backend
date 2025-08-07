import { Request, Response } from "express";
import { Model } from '../model/category'
import { categorySchema, categoryUpdateSchema } from "../schema/category";
import { error } from "console";

export const Controller = {

    async getAll(req: Request, res: Response) {
        const data = await Model.getAll();
        res.json(data)
    },

    async getByID(req: Request, res: Response) {
        const data = await Model.getByID(req.params.id);
        if (!data) return res.status(404).send('not found')
        res.json(data)
    },

    async delete(req: Request, res: Response) {
        const data = await Model.delete(req.params.id)
        if (!data) return res.status(404).send("not found")
        res.status(204).send("deleted successfully")
    },

    async create(req: Request, res: Response) {
        const parsedData = categorySchema.safeParse(req.body);
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })
        const newData = await Model.create(parsedData.data);
        res.status(201).json(newData)

    },

    async update(req: Request, res: Response) {
        const parsedData = categoryUpdateSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.status(400).json({
                message: 'Validation error',
                errors: parsedData.error.flatten().fieldErrors
            })
        const updateData = await Model.update(parsedData.data);
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

        const updateData = await Model.update({ ...patchData.data, id });
        if (!updateData) return res.status(404).send('not found')
        res.status(201).json(updateData)


    }
}
