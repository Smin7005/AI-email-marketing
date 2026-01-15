-- Create collections table for user-saved lead collections
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create collection_items table linking collections to businesses (rawdata_yellowpage_new)
CREATE TABLE "collection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_unique_item" UNIQUE("collection_id","business_id")
);
--> statement-breakpoint
-- Add foreign key constraints
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_business_id_rawdata_yellowpage_new_listing_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."rawdata_yellowpage_new"("listing_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create indexes for better query performance
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");
CREATE INDEX "collection_items_collection_id_idx" ON "collection_items" USING btree ("collection_id");
CREATE INDEX "collection_items_business_id_idx" ON "collection_items" USING btree ("business_id");
