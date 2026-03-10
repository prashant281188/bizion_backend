import { Request, Response } from "express";
import { HsnService } from "./hsn.service";
import { createHsnSchema, updateHsnSchema } from "./hsn.schema";

const service = new HsnService();

export class HsnController {
  async create(req: Request, res: Response) {
    const data = createHsnSchema.parse(req.body);

    const result = await service.create(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async getAll(req: Request, res: Response) {
    const result = await service.findAll();

    res.json({
      success: true,
      data: result,
    });
  }

  async getById(req: Request, res: Response) {
    const result = await service.findById(req.params.id);

    res.json({
      success: true,
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const data = updateHsnSchema.parse(req.body);

    const result = await service.update(req.params.id, data);

    res.json({
      success: true,
      data: result,
    });
  }

  async delete(req: Request, res: Response) {
    const result = await service.remove(req.params.id);

    res.json({
      success: true,
      message: result.message,
    });
  }
}