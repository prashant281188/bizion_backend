import { eq } from "drizzle-orm";
import { db } from "../../../config/db"
import { gstGroups } from "../../../db/schema";

export const gstGroupService = {
    async getGstGroups() {

        return db.query.gstGroups.findMany();
    },

    async getGstGroupById(id: string) {
        return db.query.gstGroups.findFirst({
            where: eq(gstGroups.id, id)
        })
    },

    async createGstGroup(name: string) {
        const gstGroup = db.insert(gstGroups).values({
            name
        }).returning()
        return gstGroup
    },

}