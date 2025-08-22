import { Request, Response } from "express";
import { partyModel } from '../model/party'
import { PartyRecord, partySchema, partyUpdateSchema } from "../schema/party";
import { buildMeta, getPagination } from "../utils/paginationUtil";


export type PartyResponse = {
    message?: string,
    success?: any,
    statusCode?: number,
    err?: any
    pagination?: any,
}

export const partyController = {
    async getAll(req: Request, res: Response): Promise<PartyResponse & { data?: PartyRecord[] }> {
        try {
            const { search = '', gstin = '', contact = '', city = '' } = req.query
            const { page, limit, offset } = getPagination(req.query);
            const filters = {
                search: String(search),
                gstin: String(gstin),
                contact: String(contact),
                city: String(city)
            }
            const [data, total] = await Promise.all([
                partyModel.getAll({ filters, offset, limit }),
                partyModel.count({ filters })
            ]);
            return res.success(
                "Fetched Successfully",
                data,
                buildMeta(page, limit, total)
            )
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }
    },

    async getByID(req: Request, res: Response) {
        const id = req.params.id
        const data = await partyModel.getByID(id);
        if (!data) return res.error("Not Found", 404)
        return res.success("Fetched", data)
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id
        const data = await partyModel.delete(id)
        if (!data) return res.error("Not Found", 404)
        return res.success("deleted successfully", data)
    },

    async create(req: Request, res: Response) {

        // First, validate the input
        const parsedData = partySchema.safeParse(req.body);
        if (!parsedData.success)
            return res.error("Validation error", 400, parsedData.error.flatten().fieldErrors)
        // Now safely access the validated data

        const { gstin, contact } = parsedData.data

        // Check for duplicate


        if (gstin) {
            const duplicate = await partyModel.getAll({ filters: { gstin } })
            if (duplicate.length > 0)
                return res.error("GSTIN already exists", 409)
        }

        if (contact) {
            const duplicate = await partyModel.getAll({ filters: { contact } })
            if (duplicate.length > 0)
                return res.error("Contact already exists", 409)
        }


        try {

            const newData = await partyModel.create(parsedData.data);
            return res.success("Created Successfully", newData)
        }
        catch (err) {
            return res.error("Internal Server Error", 500, err)
        }

    },

    async update(req: Request, res: Response) {
        const id = req.params.id
        const body = req.body
        const parsedData = partyUpdateSchema.safeParse({ ...body });
        if (!parsedData.success)
            return res.error("Validation Error", 400, parsedData.error.flatten().fieldErrors)

        const existing = await partyModel.getByID(id);
        if (!existing)
            return res.error("Not Found", 404)

        const duplicate = await partyModel.getByGstin(parsedData.data.gstin!);
        if (duplicate) {
            return res.error("GSTIN already exists", 409)
        }
        const updatedData = await partyModel.update({ ...parsedData.data, id });
        if (!updatedData) return res.error("Not Found", 404)
        return res.success("Updated Successfully", updatedData)
    },
}
