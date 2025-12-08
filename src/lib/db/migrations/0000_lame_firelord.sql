CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"description" text,
	"address" text,
	"phone" varchar(50),
	"website" varchar(255),
	"abn" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"email_content" text,
	"email_subject" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"error_message" text,
	"message_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_items_unique_business_per_campaign" UNIQUE("campaign_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"service_description" text NOT NULL,
	"tone" varchar(50) DEFAULT 'professional' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"generated_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"target_list_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"campaign_id" integer NOT NULL,
	"campaign_item_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_quotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"monthly_quota" integer NOT NULL,
	"monthly_used" integer DEFAULT 0 NOT NULL,
	"monthly_reset" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppression_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"email" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"reason" text,
	"campaign_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_list_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "target_list_items_unique_business_per_list" UNIQUE("target_list_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "target_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"default_sender_name" varchar(255),
	"default_sender_email" varchar(255),
	"default_tone" varchar(50) DEFAULT 'professional',
	"notifications" jsonb DEFAULT '{"email": true, "webhook": false}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_target_list_id_target_lists_id_fk" FOREIGN KEY ("target_list_id") REFERENCES "public"."target_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_campaign_item_id_campaign_items_id_fk" FOREIGN KEY ("campaign_item_id") REFERENCES "public"."campaign_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression_list" ADD CONSTRAINT "suppression_list_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_list_items" ADD CONSTRAINT "target_list_items_target_list_id_target_lists_id_fk" FOREIGN KEY ("target_list_id") REFERENCES "public"."target_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_list_items" ADD CONSTRAINT "target_list_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "businesses_email_idx" ON "businesses" USING btree ("email");--> statement-breakpoint
CREATE INDEX "businesses_city_idx" ON "businesses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "businesses_industry_idx" ON "businesses" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "businesses_city_industry_idx" ON "businesses" USING btree ("city","industry");--> statement-breakpoint
CREATE INDEX "campaign_items_campaign_id_idx" ON "campaign_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_items_business_id_idx" ON "campaign_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "campaign_items_status_idx" ON "campaign_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_events_organization_id_idx" ON "email_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "email_events_campaign_id_idx" ON "email_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_events_campaign_item_id_idx" ON "email_events" USING btree ("campaign_item_id");--> statement-breakpoint
CREATE INDEX "email_events_event_type_idx" ON "email_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "email_events_occurred_at_idx" ON "email_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "organization_quotas_organization_id_idx" ON "organization_quotas" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "suppression_list_organization_id_idx" ON "suppression_list" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "suppression_list_email_idx" ON "suppression_list" USING btree ("email");--> statement-breakpoint
CREATE INDEX "target_list_items_target_list_id_idx" ON "target_list_items" USING btree ("target_list_id");--> statement-breakpoint
CREATE INDEX "target_list_items_business_id_idx" ON "target_list_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "target_lists_organization_id_idx" ON "target_lists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_preferences_organization_id_idx" ON "user_preferences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");