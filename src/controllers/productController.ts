import { Request, Response } from "express";
import { productModel } from '../model/product'
import { ProductWithVariantInput, productWithVariantSchema, ProductWithVariantUpdate, productWithVariantUpdateSchema } from '../schema/product'


const checkDuplicate = async (data: ProductWithVariantUpdate | ProductWithVariantInput) => {
    const existing = await productModel.getByModel(data.model)
    if (existing) {
        return "Model already exist"
    }
    return null
}

export const productController = {
    async getAll(req: Request, res: Response) {
        const data = await productModel.getAll();
        return res.success("Products Fetched Successfully", data)
    },

    async getByID(req: Request, res: Response) {
        const data = await productModel.getByID(req.params.id);
        if (!data)
            return res.error("Not Found", 404)
        return res.success("Product Fetched Successfully", data)
    },

    async delete(req: Request, res: Response) {
        const data = await productModel.delete(req.params.id)
        if (!data)
            return res.error("Not Found", 404)
        return res.success("Product Deleted Successfully", data)
    },

    async create(req: Request, res: Response) {

        const files = req.files as Express.Multer.File[];

        const parsedData = productWithVariantSchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)

        const existing = await checkDuplicate(parsedData.data)
        if (existing)
            return res.error(existing, 409)

        const newData = await productModel.createProductWithVariants({ ...parsedData.data }, files)
        if (!newData)
            res.error("Failed to create product", 400)
        return res.success("Create Successfully", newData)

    },

    async update(req: Request, res: Response) {

        const files = req.files as Express.Multer.File[];
        const id = req.params.id
        const parsedData = productWithVariantUpdateSchema.safeParse(req.body);

        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)

        const existing = await productModel.getByID(id)
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await checkDuplicate(parsedData.data)
        if (duplicate)
            return res.error(duplicate, 409)

        const updateData = await productModel.updateProductWithVariants({ ...parsedData.data }, files);
        if (!updateData)
            return res.error("Not Found", 404)
        res.success("Updated Successfully", updateData)
    },
}
