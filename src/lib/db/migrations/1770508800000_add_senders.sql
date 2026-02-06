-- Migration: Add senders table for AWS SES email verification
-- Created: 2026-02-06

CREATE TABLE IF NOT EXISTS senders (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(255),
  dkim_tokens JSONB,
  dkim_status VARCHAR(50) DEFAULT 'pending',
  is_default BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMP,
  verification_error TEXT,
  configuration_set_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS senders_organization_id_idx ON senders(organization_id);
CREATE INDEX IF NOT EXISTS senders_email_address_idx ON senders(email_address);
CREATE INDEX IF NOT EXISTS senders_domain_idx ON senders(domain);

-- Unique constraint: one email per organization
CREATE UNIQUE INDEX IF NOT EXISTS senders_unique_email_per_org ON senders(organization_id, email_address);
