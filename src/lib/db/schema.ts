import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { eq, and, count, inArray } from 'drizzle-orm';

// Global businesses table (no tenant isolation) - maps to rawdata_yellowpage_new
export const businesses = pgTable('rawdata_yellowpage_new', {
  id: serial('listing_id').primaryKey(),
  name: varchar('company_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  city: varchar('address_suburb', { length: 100 }),
  industry: varchar('category_name', { length: 100 }),
  description: text('description_short'),
  address: text('address_suburb'),
  phone: varchar('phone_number', { length: 50 }),
  website: varchar('website_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('rawdata_yellowpage_new_email_idx').on(table.email),
  cityIdx: index('rawdata_yellowpage_new_city_idx').on(table.city),
  industryIdx: index('rawdata_yellowpage_new_industry_idx').on(table.industry),
  cityIndustryIdx: index('rawdata_yellowpage_new_city_industry_idx').on(table.city, table.industry),
}));

// Tenant-scoped target lists table
export const targetLists = pgTable('target_lists', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('target_lists_organization_id_idx').on(table.organizationId),
}));

// Target list items linking target lists to businesses
export const targetListItems = pgTable('target_list_items', {
  id: serial('id').primaryKey(),
  targetListId: integer('target_list_id').references(() => targetLists.id).notNull(),
  businessId: integer('business_id').references(() => businesses.id).notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  targetListIdx: index('target_list_items_target_list_id_idx').on(table.targetListId),
  businessIdx: index('target_list_items_business_id_idx').on(table.businessId),
  uniqueBusinessPerList: unique('target_list_items_unique_business_per_list').on(table.targetListId, table.businessId),
}));

// Tenant-scoped campaigns table
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  serviceDescription: text('service_description').notNull(),
  tone: varchar('tone', { length: 50 }).default('professional').notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, generating, ready, sending, sent, failed
  totalRecipients: integer('total_recipients').default(0).notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  generatedCount: integer('generated_count').default(0).notNull(),
  failedCount: integer('failed_count').default(0).notNull(),
  targetListId: integer('target_list_id').references(() => targetLists.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('campaigns_organization_id_idx').on(table.organizationId),
  statusIdx: index('campaigns_status_idx').on(table.status),
}));

// Campaign items linking campaigns to businesses or manual entries
export const campaignItems = pgTable('campaign_items', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  businessId: integer('business_id').references(() => businesses.id), // Nullable for manual entries
  emailContent: text('email_content'), // Generated email content
  emailSubject: varchar('email_subject', { length: 255 }), // Generated subject
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, generated, sent, failed, suppressed
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  messageId: varchar('message_id', { length: 255 }), // Email service message ID
  metadata: jsonb('metadata'), // For manual entries: { name, email }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index('campaign_items_campaign_id_idx').on(table.campaignId),
  businessIdx: index('campaign_items_business_id_idx').on(table.businessId),
  statusIdx: index('campaign_items_status_idx').on(table.status),
}));

// Email events tracking
export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  campaignItemId: integer('campaign_item_id').references(() => campaignItems.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // delivered, opened, clicked, bounced, complained, suppressed
  eventData: jsonb('event_data'), // Additional event metadata
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('email_events_organization_id_idx').on(table.organizationId),
  campaignIdx: index('email_events_campaign_id_idx').on(table.campaignId),
  itemIdx: index('email_events_campaign_item_id_idx').on(table.campaignItemId),
  typeIdx: index('email_events_event_type_idx').on(table.eventType),
  occurredAtIdx: index('email_events_occurred_at_idx').on(table.occurredAt),
}));

// Suppression list (tenant-scoped unsubscribe/bounce management)
export const suppressionList = pgTable('suppression_list', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  email: varchar('email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // unsubscribed, bounced, complained
  reason: text('reason'),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('suppression_list_organization_id_idx').on(table.organizationId),
  emailIdx: index('suppression_list_email_idx').on(table.email),
}));

// Organization quota tracking
export const organizationQuotas = pgTable('organization_quotas', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  monthlyQuota: integer('monthly_quota').notNull(),
  monthlyUsed: integer('monthly_used').default(0).notNull(),
  monthlyReset: timestamp('monthly_reset').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('organization_quotas_organization_id_idx').on(table.organizationId),
}));

// User preferences
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  userId: varchar('user_id').notNull(),
  defaultSenderName: varchar('default_sender_name', { length: 255 }),
  defaultSenderEmail: varchar('default_sender_email', { length: 255 }),
  defaultTone: varchar('default_tone', { length: 50 }).default('professional'),
  notifications: jsonb('notifications').default('{"email": true, "webhook": false}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('user_preferences_organization_id_idx').on(table.organizationId),
  userIdx: index('user_preferences_user_id_idx').on(table.userId),
}));

// Export types
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type TargetList = typeof targetLists.$inferSelect;
export type NewTargetList = typeof targetLists.$inferInsert;

export type TargetListItem = typeof targetListItems.$inferSelect;
export type NewTargetListItem = typeof targetListItems.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignItem = typeof campaignItems.$inferSelect;
export type NewCampaignItem = typeof campaignItems.$inferInsert;

export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;

export type SuppressionList = typeof suppressionList.$inferSelect;
export type NewSuppressionList = typeof suppressionList.$inferInsert;

export type OrganizationQuota = typeof organizationQuotas.$inferSelect;
export type NewOrganizationQuota = typeof organizationQuotas.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;

// User collections table (stores user's saved lead collections)
export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('collections_user_id_idx').on(table.userId),
}));

// Collection items linking collections to businesses (references rawdata_yellowpage_new.listing_id)
export const collectionItems = pgTable('collection_items', {
  id: serial('id').primaryKey(),
  collectionId: integer('collection_id').references(() => collections.id).notNull(),
  businessId: integer('business_id').references(() => businesses.id).notNull(), // FK to rawdata_yellowpage_new.listing_id
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  collectionIdx: index('collection_items_collection_id_idx').on(table.collectionId),
  businessIdx: index('collection_items_business_id_idx').on(table.businessId),
  uniqueItem: unique('collection_items_unique_item').on(table.collectionId, table.businessId),
}));

// Export enums for status fields
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  READY: 'ready',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export const CAMPAIGN_ITEM_STATUS = {
  PENDING: 'pending',
  GENERATED: 'generated',
  SENT: 'sent',
  FAILED: 'failed',
  SUPPRESSED: 'suppressed',
} as const;

export const EMAIL_EVENT_TYPE = {
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
  SUPPRESSED: 'suppressed',
} as const;

export const SUPPRESSION_TYPE = {
  UNSUBSCRIBED: 'unsubscribed',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
} as const;