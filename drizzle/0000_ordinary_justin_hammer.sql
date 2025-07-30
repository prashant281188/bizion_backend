CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryName" varchar(100) NOT NULL,
	"categoryDescription" varchar(100),
	CONSTRAINT "category_categoryName_unique" UNIQUE("categoryName")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupName" varchar NOT NULL,
	"groupDescription" varchar,
	CONSTRAINT "groups_groupName_unique" UNIQUE("groupName")
);
--> statement-breakpoint
CREATE TABLE "hsns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hsnCode" numeric NOT NULL,
	"hsnDescription" varchar DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"gstin" varchar,
	"contact" varchar,
	"addressLine1" varchar,
	"addressLine2" varchar,
	"city" varchar,
	"state" varchar,
	"pincode" numeric,
	"groupId" uuid,
	"transportId" uuid
);
--> statement-breakpoint
CREATE TABLE "productVariants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelId" uuid,
	"size" varchar,
	"finish" varchar,
	"boxQty" numeric(2),
	"mrp" numeric,
	"purchaseDiscount" numeric,
	"purchaseRate" numeric,
	"saleDiscount" numeric,
	"saleRate" numeric
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"manufacture" varchar,
	"brand" varchar,
	"hsnId" uuid NOT NULL,
	"categoryId" uuid,
	"taxId" uuid,
	"unitId" uuid,
	"metal" varchar,
	CONSTRAINT "products_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taxValue" numeric NOT NULL,
	"taxName" varchar DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"gstin" varchar,
	"contact" varchar
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unitShortName" varchar NOT NULL,
	"unitLongName" varchar NOT NULL
);
