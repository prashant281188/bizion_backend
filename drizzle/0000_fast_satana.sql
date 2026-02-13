CREATE TYPE "public"."sizeType" AS ENUM('mm', 'inch', 'pin');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'customer', 'accountant', 'staff');--> statement-breakpoint
CREATE TABLE "transports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"gstin" varchar,
	"contact" varchar,
	CONSTRAINT "transports_gstin_unique" UNIQUE("gstin")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"symbol" varchar NOT NULL,
	CONSTRAINT "units_name_unique" UNIQUE("name"),
	CONSTRAINT "units_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"gstin" varchar,
	"contact" varchar,
	"addressLine1" varchar,
	"addressLine2" varchar,
	"city" varchar NOT NULL,
	"state" varchar,
	"pincode" numeric,
	"groupId" uuid,
	"transportId" uuid,
	CONSTRAINT "parties_gstin_unique" UNIQUE("gstin")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" varchar NOT NULL,
	"manufacture" varchar,
	"metal" varchar,
	"brand" varchar,
	"hsnId" uuid NOT NULL,
	"categoryId" uuid,
	"subCategoryId" uuid,
	"unitId" uuid NOT NULL,
	"baseSlug" varchar NOT NULL,
	"isDeleted" boolean DEFAULT false,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "products_model_unique" UNIQUE("model"),
	CONSTRAINT "products_baseSlug_unique" UNIQUE("baseSlug")
);
--> statement-breakpoint
CREATE TABLE "product_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"mrp" numeric(12, 2),
	"purRate" numeric(12, 2),
	"saleRate" numeric(12, 2),
	"purDisc" numeric(5, 2) DEFAULT '0.00',
	"saleDisc" numeric(5, 2) DEFAULT '0.00',
	"fromDate" timestamp DEFAULT now(),
	"toDate" timestamp,
	"isDeleted" boolean DEFAULT false,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelId" uuid NOT NULL,
	"size" varchar,
	"sizeType" "sizeType" DEFAULT 'mm' NOT NULL,
	"finish" varchar,
	"packing" numeric(2),
	"variantSlug" varchar,
	"isDeleted" boolean DEFAULT false,
	"deletedAt" timestamp,
	CONSTRAINT "product_variants_variantSlug_unique" UNIQUE("variantSlug")
);
--> statement-breakpoint
CREATE TABLE "hsn_tax_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hsn_id" uuid NOT NULL,
	"tax_id" uuid NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "hsns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "hsns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taxName" varchar NOT NULL,
	"taxValue" numeric DEFAULT 0 NOT NULL,
	"cgst" numeric DEFAULT 0 NOT NULL,
	"igst" numeric DEFAULT 0 NOT NULL,
	"sgst" numeric DEFAULT 0 NOT NULL,
	CONSTRAINT "taxes_taxName_unique" UNIQUE("taxName")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT "groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid,
	"variantId" uuid,
	"imageUrl" varchar NOT NULL,
	"isPrimary" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(512) NOT NULL,
	"user_agent" text,
	"ip" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"phone_verified" timestamp,
	"phone_verification_code" varchar(10),
	"phone_verification_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_hsnId_hsns_id_fk" FOREIGN KEY ("hsnId") REFERENCES "public"."hsns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_subCategoryId_categories_id_fk" FOREIGN KEY ("subCategoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unitId_units_id_fk" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_rates" ADD CONSTRAINT "product_rates_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_modelId_products_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hsn_tax_history" ADD CONSTRAINT "hsn_tax_history_hsn_id_hsns_id_fk" FOREIGN KEY ("hsn_id") REFERENCES "public"."hsns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hsn_tax_history" ADD CONSTRAINT "hsn_tax_history_tax_id_taxes_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;