-- =====================================================
-- Campaign Tables Migration for Supabase
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create target_lists table first (campaigns references this)
CREATE TABLE IF NOT EXISTS target_lists (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS target_lists_organization_id_idx ON target_lists(organization_id);

-- 2. Create target_list_items table
CREATE TABLE IF NOT EXISTS target_list_items (
  id SERIAL PRIMARY KEY,
  target_list_id INTEGER NOT NULL REFERENCES target_lists(id),
  business_id BIGINT NOT NULL REFERENCES rawdata_yellowpage_new(listing_id),
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT target_list_items_unique_business_per_list UNIQUE(target_list_id, business_id)
);

CREATE INDEX IF NOT EXISTS target_list_items_target_list_id_idx ON target_list_items(target_list_id);
CREATE INDEX IF NOT EXISTS target_list_items_business_id_idx ON target_list_items(business_id);

-- 3. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  service_description TEXT NOT NULL,
  tone VARCHAR(50) NOT NULL DEFAULT 'professional',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  generated_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  target_list_id INTEGER REFERENCES target_lists(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_organization_id_idx ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);

-- 4. Create campaign_items table
CREATE TABLE IF NOT EXISTS campaign_items (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  business_id BIGINT REFERENCES rawdata_yellowpage_new(listing_id),
  email_content TEXT,
  email_subject VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  error_message TEXT,
  message_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaign_items_campaign_id_idx ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_items_business_id_idx ON campaign_items(business_id);
CREATE INDEX IF NOT EXISTS campaign_items_status_idx ON campaign_items(status);

-- 5. Create email_events table
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  campaign_item_id INTEGER NOT NULL REFERENCES campaign_items(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_events_organization_id_idx ON email_events(organization_id);
CREATE INDEX IF NOT EXISTS email_events_campaign_id_idx ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS email_events_campaign_item_id_idx ON email_events(campaign_item_id);
CREATE INDEX IF NOT EXISTS email_events_event_type_idx ON email_events(event_type);
CREATE INDEX IF NOT EXISTS email_events_occurred_at_idx ON email_events(occurred_at);

-- 6. Create suppression_list table
CREATE TABLE IF NOT EXISTS suppression_list (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  reason TEXT,
  campaign_id INTEGER REFERENCES campaigns(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS suppression_list_organization_id_idx ON suppression_list(organization_id);
CREATE INDEX IF NOT EXISTS suppression_list_email_idx ON suppression_list(email);

-- 7. Create organization_quotas table
CREATE TABLE IF NOT EXISTS organization_quotas (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  monthly_quota INTEGER NOT NULL,
  monthly_used INTEGER NOT NULL DEFAULT 0,
  monthly_reset TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_quotas_organization_id_idx ON organization_quotas(organization_id);

-- 8. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  default_sender_name VARCHAR(255),
  default_sender_email VARCHAR(255),
  default_tone VARCHAR(50) DEFAULT 'professional',
  notifications JSONB DEFAULT '{"email": true, "webhook": false}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_preferences_organization_id_idx ON user_preferences(organization_id);
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
