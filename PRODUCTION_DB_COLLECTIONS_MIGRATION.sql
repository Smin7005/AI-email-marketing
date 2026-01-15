-- =====================================================
-- Collections Feature Migration for Production Database
-- =====================================================
-- Execute this SQL in your Supabase Production Database (zujqziqteggihirewuxf.supabase.co)
-- Go to: Dashboard > SQL Editor > New Query
-- =====================================================

-- Create collections table for user-saved lead collections
CREATE TABLE IF NOT EXISTS "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create collection_items table linking collections to businesses (rawdata_yellowpage_new)
CREATE TABLE IF NOT EXISTS "collection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_unique_item" UNIQUE("collection_id","business_id")
);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add FK for collection_id -> collections.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'collection_items_collection_id_collections_id_fk'
    ) THEN
        ALTER TABLE "collection_items"
        ADD CONSTRAINT "collection_items_collection_id_collections_id_fk"
        FOREIGN KEY ("collection_id")
        REFERENCES "public"."collections"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;

    -- Add FK for business_id -> rawdata_yellowpage_new.listing_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'collection_items_business_id_rawdata_yellowpage_new_listing_id_fk'
    ) THEN
        ALTER TABLE "collection_items"
        ADD CONSTRAINT "collection_items_business_id_rawdata_yellowpage_new_listing_id_fk"
        FOREIGN KEY ("business_id")
        REFERENCES "public"."rawdata_yellowpage_new"("listing_id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
END
$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "collections_user_id_idx" ON "collections" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "collection_items_collection_id_idx" ON "collection_items" USING btree ("collection_id");
CREATE INDEX IF NOT EXISTS "collection_items_business_id_idx" ON "collection_items" USING btree ("business_id");

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('collections', 'collection_items');
