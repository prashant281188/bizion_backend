import { Request, Response } from "express";
import { productModel } from '../model/product'

import { productSchema, productUpdateSchema } from '../schema/product'

export const productController = {

    async getAll(req: Request, res: Response) {
        const data = await productModel.getAll();
        return res.success("Fetched Successfully", data)
    },

    async getByID(req: Request, res: Response) {
        const data = await productModel.getByID(req.params.id);
        if (!data)
            return res.error("Not Found", 404)
        return res.success("Fetched Successfully", data)
    },

    async delete(req: Request, res: Response) {
        const data = await productModel.delete(req.params.id)
        if (!data)
            return res.error("Not Found", 404)
        return res.success("deleted successfully", data)
    },

    async create(req: Request, res: Response) {
        const parsedData = productSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)
        const newData = await productModel.createProductWithVariants(parsedData.data);
        return res.success("Create Successfully", newData)

    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const parsedData = productUpdateSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)
        const updateData = await productModel.update(parsedData.data);
        if (!updateData)
            return res.error("Not Found", 404)
        res.success("Updated Successfully", updateData)
    },
    

}
