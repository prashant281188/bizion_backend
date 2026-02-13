ALTER TABLE "products" DROP CONSTRAINT "products_baseSlug_unique";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_variantSlug_unique";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_hsnId_hsns_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_subCategoryId_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_unitId_units_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_modelId_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "packing" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "taxValue" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "taxValue" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "cgst" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "cgst" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "igst" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "igst" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "sgst" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "taxes" ALTER COLUMN "sgst" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hsn_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sub_category_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_slug" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "purchase_rate" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "sale_rate" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "purchase_discount" numeric(5, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "sale_discount" numeric(5, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "from_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "to_date" timestamp;--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_rates" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "model_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "size_type" "sizeType" DEFAULT 'mm' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "varinat_slug" varchar;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_hsn_id_hsns_id_fk" FOREIGN KEY ("hsn_id") REFERENCES "public"."hsns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sub_category_id_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_model_id_products_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "hsnId";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "categoryId";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "subCategoryId";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "unitId";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "baseSlug";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "isDeleted";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "deletedAt";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "purRate";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "saleRate";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "purDisc";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "saleDisc";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "fromDate";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "toDate";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "isDeleted";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "deletedAt";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "product_rates" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "modelId";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "sizeType";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "variantSlug";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "isDeleted";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "deletedAt";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_slug_unique" UNIQUE("base_slug");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_varinat_slug_unique" UNIQUE("varinat_slug");