ALTER TABLE "dispatches" DROP CONSTRAINT "dispatches_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "dispatch_allocations" DROP CONSTRAINT "dispatch_allocations_dispatch_item_id_dispatch_items_id_fk";
--> statement-breakpoint
ALTER TABLE "dispatch_allocations" DROP CONSTRAINT "dispatch_allocations_order_item_id_order_items_id_fk";
--> statement-breakpoint
ALTER TABLE "dispatch_items" DROP CONSTRAINT "dispatch_items_order_item_id_order_items_id_fk";
--> statement-breakpoint
DROP INDEX "dispatches_order_idx";--> statement-breakpoint
ALTER TABLE "dispatch_allocations" ALTER COLUMN "dispatch_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatch_allocations" ALTER COLUMN "order_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatch_allocations" ALTER COLUMN "allocated_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatch_items" ALTER COLUMN "dispatch_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatch_items" ALTER COLUMN "variant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dispatch_allocations" ADD CONSTRAINT "dispatch_allocations_dispatch_item_id_dispatch_items_id_fk" FOREIGN KEY ("dispatch_item_id") REFERENCES "public"."dispatch_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_allocations" ADD CONSTRAINT "dispatch_allocations_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dispatch_alloc_dispatch_item_idx" ON "dispatch_allocations" USING btree ("dispatch_item_id");--> statement-breakpoint
CREATE INDEX "dispatch_alloc_order_item_idx" ON "dispatch_allocations" USING btree ("order_item_id");--> statement-breakpoint
ALTER TABLE "dispatches" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "dispatch_items" DROP COLUMN "order_item_id";