import { NextFunction, Request, Response } from "express";
import { publicService } from "./public.service";


export const publicController = {

    async getCatalog(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getCatalogProducts();
            res.json({
                success: true,
                message: "Catalog fetched",
                data
            })
        } catch (err) {
            next(err)
        }
    },

    async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getActiveCategories();
            res.json({
                success: true,
                message: "Categories fetched",
                data
            });
        } catch (err) {
            next(err)
        }
    },

    async getBrands(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getBrands();
            res.json({
                success: true,
                message: "Brands fetched",
                data
            })
        } catch (err) {
            next(err)
        }
    },

    async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, search = "", category = "", brand = "" } = req.query;

            const data = await publicService.getProducts({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: String(search),
                brand: String(brand),
                category: String(category)
            });
            res.json({
                success: true,
                message: "Products fetched",
                data: data.data,
                meta: data.meta
            })
        } catch (err) {
            next(err)
        }
    },

    async getProductDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id
            const data = await publicService.getProductDetailNew(id);
            res.json({
                success: true,
                message: "Product detail fetched",
                data
            })
        } catch (err) {
            next(err)
        }
    },

    async getCarouselData(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getCarouselData();
            res.json({
                success: true,
                message: "Carousel data fetched",
                data
            })
        } catch (err) {
            next(err)
        }
    }

};
