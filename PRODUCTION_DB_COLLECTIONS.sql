-- ============================================================
-- CREATE THESE TABLES IN THE PRODUCTION DATABASE (zujqziqteggihirewuxf)
-- ============================================================

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);

-- Create collection_items table (references rawdata_yellowpage_new.listing_id which is BIGINT)
CREATE TABLE IF NOT EXISTS collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  listing_id BIGINT NOT NULL REFERENCES rawdata_yellowpage_new(listing_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS collection_items_collection_id_idx ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS collection_items_listing_id_idx ON collection_items(listing_id);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS collection_items_unique_item
  ON collection_items(collection_id, listing_id);
