import { randomUUID as uuid } from "crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { permissions, roles, rolePermissions, users } from "../db/schema";

/* =====================================================
   ALL PERMISSIONS
   Format: resource:action
===================================================== */

const RESOURCES = [
  "user",
  "role",
  "permission",
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
  "order",
  "inventory",
  "dispatch",
  "purchase_receipt",
  "audit",
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

  // 1. Upsert all permissions
  await db.insert(permissions).values(ALL_PERMISSIONS).onConflictDoNothing();
  console.log(`✅ ${ALL_PERMISSIONS.length} permissions upserted`);

  // 2. Upsert superadmin role (system role — cannot be deleted or have permissions changed)
  const superAdminRoleId = uuid();
  await db
    .insert(roles)
    .values({ id: superAdminRoleId, name: "superadmin", isSystem: true })
    .onConflictDoNothing();

  // Mark existing superadmin as system role in case it was created before this flag existed
  await db.update(roles).set({ isSystem: true }).where(eq(roles.name, "superadmin"));

  console.log("✅ Role 'superadmin' upserted (isSystem = true)");

  // 3. Resolve the actual role ID (handles pre-existing rows)
  const existingRole = await db.query.roles.findFirst({
    where: eq(roles.name, "superadmin"),
  });
  const resolvedRoleId = existingRole?.id ?? superAdminRoleId;

  // 4. Assign ALL permissions to superadmin
  const existingPerms = await db.query.permissions.findMany();
  await db
    .insert(rolePermissions)
    .values(existingPerms.map((p) => ({ roleId: resolvedRoleId, permissionId: p.id })))
    .onConflictDoNothing();

  console.log(`✅ All ${existingPerms.length} permissions assigned to 'superadmin'`);

  // 5. Upsert the admin user
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
