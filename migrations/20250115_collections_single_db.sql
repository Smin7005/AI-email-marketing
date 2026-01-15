-- Migration: Move collections to single database architecture
-- Creates collections and collection_items tables in production DB

-- Create collections table (if not exists)
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);

-- Create collection_items table (if not exists)
CREATE TABLE IF NOT EXISTS collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  business_id BIGINT NOT NULL REFERENCES rawdata_yellowpage_new(listing_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS collection_items_collection_id_idx ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS collection_items_business_id_idx ON collection_items(business_id);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS collection_items_unique_item
  ON collection_items(collection_id, business_id);
