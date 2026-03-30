import { randomUUID as uuid } from "crypto";
import bcrypt from "bcrypt";
import { db } from "../config/db";
import { permissions } from "../db/schema/permission";
import { roles } from "../db/schema/role";
import { rolePermissions } from "../db/schema/rolePermission";
import { users } from "../db/schema/user";

/* =====================================================
   ALL PERMISSIONS
   Format: resource:action
===================================================== */

const RESOURCES = [
  "user",
  "role",
  "category",
  "product",
  "brand",
  "carousel",
  "image",
  "option",
  "unit",
  "variant",
  "gst",
  "hsn",
  "party",
  "field_order",
  "inventory"
] as const;

const ACTIONS = ["create", "read", "update", "delete"] as const;

const ALL_PERMISSIONS = RESOURCES.flatMap((resource) =>
  ACTIONS.map((action) => ({
    id: uuid(),
    code: `${resource}:${action}`,
    description: `Can ${action} ${resource}`,
  }))
);

/* =====================================================
   SEED
===================================================== */

async function seedAdmin() {
  console.log("🌱 Starting admin seed...");

  // 1. Upsert permissions
  await db
    .insert(permissions)
    .values(ALL_PERMISSIONS)
    .onConflictDoNothing();

  console.log(`✅ ${ALL_PERMISSIONS.length} permissions upserted`);

  // 2. Create superadmin role
  const superAdminRoleId = uuid();

  await db
    .insert(roles)
    .values({ id: superAdminRoleId, name: "superadmin" })
    .onConflictDoNothing();

  console.log("✅ Role 'superadmin' upserted");

  // 3. Fetch the actual permission IDs from DB (handles pre-existing rows)
  const existingPerms = await db.query.permissions.findMany();

  const rolePermValues = existingPerms.map((p) => ({
    roleId: superAdminRoleId,
    permissionId: p.id,
  }));

  // Need the actual role ID if it already existed
  const existingRole = await db.query.roles.findFirst({
    // @ts-ignore — drizzle where helper
    where: (r: any, { eq }: any) => eq(r.name, "superadmin"),
  });

  const resolvedRoleId = existingRole?.id ?? superAdminRoleId;

  await db
    .insert(rolePermissions)
    .values(rolePermValues.map((rp) => ({ ...rp, roleId: resolvedRoleId })))
    .onConflictDoNothing();

  console.log(`✅ All permissions assigned to 'superadmin' role`);

  // 4. Create the admin user
  const hashed = await bcrypt.hash("Admin@1234", 10);

  await db
    .insert(users)
    .values({
      id: uuid(),
      firstName: "Prashant",
      lastName: "Garg",
      email: "prashant281188@gmail.com",
      phone: "+919917174488",
      password: hashed,
      roleId: resolvedRoleId,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
    })
    .onConflictDoNothing();

  console.log("✅ Admin user 'prashant281188@gmail.com' created");
  console.log("   Password: Admin@1234  ← change this after first login");
  console.log("🎉 Admin seed completed");

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
