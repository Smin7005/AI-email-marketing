-- Drop foreign key constraint from collection_items if it exists
ALTER TABLE "collection_items" DROP CONSTRAINT IF EXISTS "collection_items_company_id_fkey";
ALTER TABLE "collection_items" DROP CONSTRAINT IF EXISTS "collection_items_business_id_fkey";

-- Ensure company_id column can store large IDs from DB2 (varchar to handle bigint values as strings)
ALTER TABLE "collection_items" ALTER COLUMN "company_id" TYPE varchar(50);
