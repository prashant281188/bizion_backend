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
            if (!data) return res.error("Not found", 404)
            return res.success(
                "Fetched successfully",
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
            return res.error("Internal server error", 500, err)

        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await categoryModel.getByID(id);
        if (!data) return res.error("Not found", 404)
        res.success("Fetched Successfully", data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await categoryModel.delete(id)
        if (!data) return res.error("Not Found", 404)
        return res.success("Deleted Successfully", data)

    },

    async create(req: Request, res: Response) {
        // First, validate the input
        const parsedData = categorySchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.error("Validation Error", 404, parsedData.error.flatten().fieldErrors)
        }

        // Now safely access the validated data
        const { categoryName } = parsedData.data;

        // Check for duplicate
        const duplicate = await categoryModel.getByName(categoryName);

        if (duplicate) {
            return res.error("Duplicate Data", 409)
        }

        // Create new entry
        try {
            const newData = await categoryModel.create(parsedData.data);
            return res.success("Created Successfully", newData);
        } catch (err) {
            return res.error("Internal server error", 500, err)
        }
    },


    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body

        // validate the input
        const parsedData = categorySchema.safeParse({ ...body });

        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)


        const existing = await categoryModel.getByID(id)
        if (!existing)
            return res.error("Not found", 404)

        // Check for duplicate
        const duplicate = await categoryModel.getByName(parsedData.data.categoryName.trim());
        if (duplicate) {
            return res.error("Duplicate Entry", 409)
        }

        const updateData = await categoryModel.update({ ...parsedData.data, id });

        if (!updateData) return res.error("Not Found", 400)
        res.success("Updated Successfully", 202, updateData)
    },

    async patch(req: Request, res: Response) {
        const id = req.params.id
        const patchData = categoryUpdateSchema.partial().safeParse(req.body);
        if (!patchData.success)
            return res.error("Validation Error", 400, patchData.error.flatten().fieldErrors)

        const updateData = await categoryModel.update({ ...patchData.data, id });
        if (!updateData) return res.error('Not found', 404)
        return res.success("Updated successfully", updateData)


    }
}
