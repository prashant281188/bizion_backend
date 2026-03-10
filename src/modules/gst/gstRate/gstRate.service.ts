import { eq } from "drizzle-orm";
import { db } from "../../../config/db"
import { gstRates } from "../../../db/schema";

export const gstRateService = {

    async getGstRate() {

        return await db.query.gstRates.findMany();

    },

    async getGstRateById(id: string) {
        return await db.query.gstRates.findFirst({
            where: eq(gstRates.id, id)
        })
    },

    async createGstRate(cgst:string, gstGroupId: string, effectiveFrom:Date, effectiveTo:Date, igst: string, sgst:string, ) {
        return await db.insert(gstRates).values({
            gstGroupId,
            effectiveFrom,
            cgst,
            igst,
            sgst,
            effectiveTo
        })
    }
}