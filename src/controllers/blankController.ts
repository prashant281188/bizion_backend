import { Request, Response } from "express";
import { Model } from '../model/category'

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

    async create(req: Request, res: Response) {

    },

    async update(req: Request, res: Response) {

    },

    async delete(req: Request, res: Response) {

        const id = req.params.id
        const success = false

    }
}
