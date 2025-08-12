import { Request, Response } from "express";
import { groupModel } from '../model/group'
import { groupSchema } from "../schema/group";

export const groupController = {

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

            const [data, total] = await Promise.all([
                await groupModel.getAll({ filters, offset, limit: limitNum }),
                await groupModel.count({ filters })
            ]);

            if (!data) return res.error("Not Found", 404)

            return res.success(
                "Fetched Successfully",
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
        const data = await groupModel.getByID(id);
        if (!data) return res.error("Not found", 404)
        res.json(data)
    },

    async delete(req: Request, res: Response) {

        const id = req.params.id

        const data = await groupModel.delete(id)
        if (!data) return res.error("Not found", 404)
        return res.success("Deleted Successfully", data)
    },

    async create(req: Request, res: Response) {
        // First, validate the input
        const parsedData = groupSchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.error("Validation Error", 404, parsedData.error.flatten().fieldErrors)
        }

        // Now safely access the validated data
        const { groupName } = parsedData.data;

        // Check for duplicate
        const duplicate = await groupModel.getByName(groupName);

        if (duplicate) {
            return res.error("Duplicate Data", 409)
        }

        // Create new entry
        try {
            const newData = await groupModel.create(parsedData.data);
            return res.success("Created Successfully", newData)
        } catch (err) {
            return res.error("Internal server error", 500, err)
        }
    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body

        // validate the input
        const parsedData = groupSchema.safeParse({ ...body });

        if (!parsedData.success)
            return res.error("Validation Error", 404, parsedData.error.flatten().fieldErrors)

        const existing = await groupModel.getByID(id)
        if (!existing)
            return res.error("Not Found", 404)

        // Check for duplicate
        const duplicate = await groupModel.getByName(parsedData.data.groupName.trim());
        if (duplicate) {
            return res.error("Duplicate Data", 409)
        }

        const updateData = await groupModel.update({ ...parsedData.data, id });

        if (!updateData) return res.error("Not found", 404)
        res.success("Updated Successfully", updateData)
    },

}
