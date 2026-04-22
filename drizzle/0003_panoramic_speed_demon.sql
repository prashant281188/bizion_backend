CREATE TYPE "public"."bank_account_type" AS ENUM('current', 'savings', 'cc', 'od');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('sole_proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'one_person_company', 'huf', 'trust', 'society', 'ngo', 'government', 'other');--> statement-breakpoint
CREATE TYPE "public"."financial_year_start_month" AS ENUM('april', 'january');--> statement-breakpoint
CREATE TYPE "public"."business_gst_reg_type" AS ENUM('regular', 'composition', 'unregistered', 'sez_unit', 'sez_developer');--> statement-breakpoint
CREATE TABLE "business_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"business_type" "business_type" DEFAULT 'sole_proprietorship' NOT NULL,
	"logo_url" text,
	"signature_url" text,
	"website_url" text,
	"primary_phone" text NOT NULL,
	"alt_phone" text,
	"primary_email" text NOT NULL,
	"alt_email" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"district" text,
	"state" text NOT NULL,
	"state_code" text NOT NULL,
	"pincode" text NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"gstin" text,
	"gst_registration_type" "business_gst_reg_type" DEFAULT 'unregistered',
	"pan_no" text,
	"tan_no" text,
	"cin" text,
	"llpin" text,
	"udyam_no" text,
	"iec_code" text,
	"fssai_license_no" text,
	"drug_license_no" text,
	"shop_establishment_no" text,
	"is_rcm_applicable" boolean DEFAULT false NOT NULL,
	"is_tds_applicable" boolean DEFAULT false NOT NULL,
	"is_tcs_applicable" boolean DEFAULT false NOT NULL,
	"is_eway_bill_required" boolean DEFAULT false NOT NULL,
	"is_e_invoicing_enabled" boolean DEFAULT false NOT NULL,
	"eway_bill_threshold" integer DEFAULT 50000,
	"financial_year_start" "financial_year_start_month" DEFAULT 'april' NOT NULL,
	"invoice_prefix" text DEFAULT 'INV',
	"credit_note_prefix" text DEFAULT 'CN',
	"debit_note_prefix" text DEFAULT 'DN',
	"purchase_order_prefix" text DEFAULT 'PO',
	"challan_prefix" text DEFAULT 'DC',
	"invoice_terms_and_conditions" text,
	"invoice_notes" text,
	"bank_name" text,
	"bank_account_no" text,
	"bank_ifsc" text,
	"bank_micr" text,
	"bank_branch" text,
	"bank_account_type" "bank_account_type" DEFAULT 'current',
	"upi_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_details_gstin_unique" UNIQUE("gstin")
);
--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" DROP CONSTRAINT "purchase_receipt_allocations_receipt_item_id_purchase_receipt_items_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" DROP CONSTRAINT "purchase_receipt_allocations_order_item_id_order_items_id_fk";
--> statement-breakpoint
DROP INDEX "brands_slug_idx";--> statement-breakpoint
DROP INDEX "hsn_gst_histort_effective_idx";--> statement-breakpoint
DROP INDEX "variants_sku_unique";--> statement-breakpoint
DROP INDEX "variant_option_values_pk";--> statement-breakpoint
ALTER TABLE "variant_rates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "variant_rates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "is_deleted" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "variant_option_values" ALTER COLUMN "option_value_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "variant_images" ALTER COLUMN "is_primary" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" ALTER COLUMN "receipt_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" ALTER COLUMN "order_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" ALTER COLUMN "allocated_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "variant_rates" ADD COLUMN "effective_from" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "variant_rates" ADD COLUMN "effective_to" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "option_values" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "quantity_on_hand" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "quantity_reserved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "quantity_ordered" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "quantity_to_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "reorder_point" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "reorder_qty" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "business_gstin_idx" ON "business_details" USING btree ("gstin");--> statement-breakpoint
CREATE UNIQUE INDEX "business_pan_idx" ON "business_details" USING btree ("pan_no");--> statement-breakpoint
CREATE UNIQUE INDEX "business_cin_idx" ON "business_details" USING btree ("cin");--> statement-breakpoint
CREATE INDEX "business_state_code_idx" ON "business_details" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "business_type_idx" ON "business_details" USING btree ("business_type");--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" ADD CONSTRAINT "pra_receipt_item_fk" FOREIGN KEY ("receipt_item_id") REFERENCES "public"."purchase_receipt_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipt_allocations" ADD CONSTRAINT "pra_order_item_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brands_slug_unique" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hsn_gst_historY_effective_idx" ON "hsn_gst_history" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "rates_variant_effective_idx" ON "variant_rates" USING btree ("variant_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_sku_product_unique" ON "product_variants" USING btree ("sku","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_barcode_product_unique" ON "product_variants" USING btree ("barcode","product_id");--> statement-breakpoint
CREATE INDEX "variants_deleted_idx" ON "product_variants" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_option_values_unique" ON "variant_option_values" USING btree ("variant_id","option_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "option_values_option_value_unique" ON "option_values" USING btree ("option_id","option_value");--> statement-breakpoint
CREATE INDEX "pra_receipt_item_idx" ON "purchase_receipt_allocations" USING btree ("receipt_item_id");--> statement-breakpoint
CREATE INDEX "pra_order_item_idx" ON "purchase_receipt_allocations" USING btree ("order_item_id");--> statement-breakpoint
ALTER TABLE "variant_rates" DROP COLUMN "from";--> statement-breakpoint
ALTER TABLE "variant_rates" DROP COLUMN "to";--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "quantity";