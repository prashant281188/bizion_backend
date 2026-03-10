import { eq } from "drizzle-orm"
import { db } from "../../config/db"
import { products } from "../../db/schema"



export const productService = {

  async list() {
    return db.query.products.findMany({

    })
  },


  async getById(id: string) {

    return db.query.products.findFirst({
      where: eq(products.id, id)
    })
  }
}