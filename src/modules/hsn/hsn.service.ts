import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { gstGroups, hsnCodes } from "../../db/schema";
import { AppError } from "../../middlewares/errorHandler";


export class HsnService {
    async create(data: {
        code: string;
        description?: string;
        gstGroupId: string;
    }) {
        // Check GST group exists
        const gstGroup = await db.query.gstGroups.findFirst({
            where: eq(gstGroups.id, data.gstGroupId),
        });

        if (!gstGroup) {
            throw new AppError("Invalid GST Group", 400);
        }

        // Check duplicate HSN
        const existing = await db.query.hsnCodes.findFirst({
            where: eq(hsnCodes.code, data.code),
        });

        if (existing) {
            throw new AppError("HSN already exists", 400);
        }

        const [hsn] = await db
            .insert(hsnCodes)
            .values(data)
            .returning();

        return hsn;
    }

    async findAll() {
        return db.query.hsnCodes.findMany({
            with: {
                gstHistory: true
            },
        });
    }

    async findById(id: string) {
        const hsn = await db.query.hsnCodes.findFirst({
            where: eq(hsnCodes.id, id),
            with: {
                gstHistory: true
            },
        });

        if (!hsn) {
            throw new AppError("HSN not found", 404);
        }

        return hsn;
    }

    async update(
        id: string,
        data: {
            description?: string;
            gstGroupId?: string;
            isActive?: boolean;
        }
    ) {
        const existing = await db.query.hsnCodes.findFirst({
            where: eq(hsnCodes.id, id),
        });

        if (!existing) {
            throw new AppError("HSN not found", 404);
        }

        if (data.gstGroupId) {
            const gstGroup = await db.query.gstGroups.findFirst({
                where: eq(gstGroups.id, data.gstGroupId),
            });

            if (!gstGroup) {
                throw new AppError("Invalid GST Group", 400);
            }
        }

        const [updated] = await db
            .update(hsnCodes)
            .set(data)
            .where(eq(hsnCodes.id, id))
            .returning();

        return updated;
    }

    async remove(id: string) {
        const existing = await db.query.hsnCodes.findFirst({
            where: eq(hsnCodes.id, id),
        });

        if (!existing) {
            throw new AppError("HSN not found", 404);
        }

        // Soft delete recommended
        await db
            .update(hsnCodes)
            .set({ isActive: false })
            .where(eq(hsnCodes.id, id));

        return { message: "HSN deactivated successfully" };
    }
}