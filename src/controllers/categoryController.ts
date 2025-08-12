import { Request, Response } from "express";
import { categoryModel } from '../model/category'
import { categories, categorySchema, categoryUpdateSchema } from "../schema/category";
import ExcelJS from "exceljs"
import { buildMeta, getPagination } from "../utils/paginationUtil";

export const categoryController = {

    async exportExcel(req: Request, res: Response) {

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
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("categories");

            worksheet.columns = [
                { header: "Category Name", key: "categoryName", width: 50 },
                { header: "Category Description", key: "categoryDescription", width: 50 }
            ];

            const [data] = await Promise.all([await categoryModel.getAll({ filters, offset, limit: limitNum }),]);

            console.log(data)
            if (!data)
                return res.error("Not found", 404)


            data.forEach((cat) => {
                worksheet.addRow({
                    categoryName: cat.categoryName,
                    categoryDescription: cat.categoryDescription
                })
            })

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=categories_${Date.now()}.xlsx`
            )

            await workbook.xlsx.write(res);
            res.end();

        }
        catch (err) {
            return res.error("Internal server error", 500, err)
        }

    },

    async importExcel(req: Request, res: Response) {
        try {

            if (!req.file) {
                console.log(req.file)
                return res.error("Not file uploaded ", 400);

            }
            const workbook = new ExcelJS.Workbook();
            // @ts-ignore
            await workbook.xlsx.load(req.file.buffer)
            const sheet = workbook.getWorksheet(1);

            sheet?.eachRow((row, rowNumber) => {

                if (rowNumber === 1) return;

                const parsed = categorySchema.safeParse({
                    categoryName: row.getCell(1).value ?? "",
                    categoryDescription: row.getCell(2).value ?? ""
                })
                if (parsed.success) {
                    categoryModel.create(parsed.data)
                }
                console.log(`Row ${rowNumber}:`, row.values)
            })

            res.success("Uploaded successfull.....")
        }
        catch (err) {
            return res.error("Failed to import", 500, err)
        }

    },
    async getAll(req: Request, res: Response) {
        try {
            const { search = '' } = req.query
            const { page, limit, offset } = getPagination(req.query);

            const filters = {
                search: String(search),
            };

            const [data, total] = await Promise.all([await categoryModel.getAll({ filters, offset, limit }),
            await categoryModel.count({ filters })
            ]);
            if (!data) return res.error("Not found", 404)
            return res.success(
                "Fetched successfully",
                data,
                buildMeta(page, limit, total)
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
