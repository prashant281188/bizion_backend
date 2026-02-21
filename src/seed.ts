import { db } from "./config/db";
import { productList } from "./data";
import { categories, permissions, products } from "./db/schema";
import { brands } from "./db/schema/brand";
import { roles } from "./db/schema/role";
import { rolePermissions } from "./db/schema/rolePermission";
import { users } from "./db/schema/user";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

async function seed() {
  // const adminRoleId = uuid();

  // await db.insert(roles).values([
  //   { id: adminRoleId, name: "admin" },
  // ]);

  // const perms = [
  //   "category:read",
  //   "category:create",
  //   "category:update",
  //   "category:delete",
  //   "product:read",
  //   "product:create",
  //   "product:update",
  //   "product:delete",
  //   "user:read",
  //   "user:create",
  //   "user:update",
  //   "user:delete",
  // ];

  // const permIds = perms.map((code) => ({
  //   id: uuid(),
  //   code,
  // }));

  // await db.insert(permissions).values(permIds);

  // await db.insert(rolePermissions).values(
  //   permIds.map((p) => ({
  //     roleId: adminRoleId,
  //     permissionId: p.id,
  //   }))
  // );

  // const hashed = await bcrypt.hash("Admin@123", 10);

  // await db.insert(users).values({
  //   id: uuid(),
  //   email: "admin@example.com",
  //   password: hashed,
  //   roleId: adminRoleId,
  // });


  // const categoriesList = [
  //   "cabinet handle",
  //   "door handle",
  //   "profile handle",
  //   "bathroom accessories",
  //   "aluminum profile",
  //   "door closer",
  //   "sofa leg",
  //   "tower bolt",
  // ]

  // const categoriesIds = categoriesList.map((name) => ({
  //   id: uuid(),
  //   name
  // }))

  // await db.insert(categories).values(categoriesIds)


  // const brandsList = [
  //   "flybird",
  //   "hini",
  //   "poins",
  //   "nexito",
  //   "dytor"
  // ]

  // const brandIds = brandsList.map((brand) => ({
  //   id: uuid(),
  //   name: brand
  // }))
  // await db.insert(brands).values(brandIds)


  

  await db.insert(products).values(productList)

  console.log("✅ Seed completed");
  process.exit(0);
}
seed();
