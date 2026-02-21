import { Request, Response } from "express";
import { publicService } from "./public.service";


export const publicController = {

    async getCategories(req: Request, res: Response) {

        const data = await publicService.getActiveCategories();
        res.json({
            success: true,
            message: "Category updated",
            data

        });
    },

    async getBrands(req: Request, res: Response) {
        const data = await publicService.getBrands();
        res.json({
            success: true,
            message: "Brands fetched",
            data
        })
    },

    async getProducts(req: Request, res: Response) {
        const { page, limit, search = "" } = req.query;

        const data = await publicService.getProducts({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            search: String(search)
        });
        res.json({
            success: true,
            message: "Products fetched",
            data: data.data,
            meta: data.meta
        })
    },

    async getProductDetail(req: Request, res: Response) {
        const id = req.params.id
        const data = await publicService.getProductDetail(id);
        res.json({
            success: true,
            message: "Product Detail fetched successfully",
            data
        })
    },

    async gerCarouselData(req: Request, res: Response) {
        const data = await publicService.getCarouselData();
        res.json({
            success: true,
            message: "Product Detail fetched successfully",
            data
        })
    }

};
