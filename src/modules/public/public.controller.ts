import { NextFunction, Request, Response } from "express";
import { publicService } from "./public.service";
import { generateCatalogHtml } from "./catalog-html.service";
import { ListProductsInput } from "./public.schema";

export const publicController = {
  async getCarouselData(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getCarouselData();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getActiveCategories();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getBrands(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getBrands();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getProducts(req.query as unknown as ListProductsInput);
      res.json({ success: true, data: data.items, meta: data.meta });
    } catch (err) { next(err); }
  },

  async getProductDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getProductDetail(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getCatalog(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getCatalog();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getCatalogPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { brandId, categoryId } = req.query as { brandId?: string; categoryId?: string };
      const html = await generateCatalogHtml({ brandId, categoryId });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="catalog-${Date.now()}.html"`);
      res.send(html);
    } catch (err) { next(err); }
  },
};
