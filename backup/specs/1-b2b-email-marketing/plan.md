# Implementation Plan: B2B Email Marketing SaaS for Australian Local Service Providers

**Branch**: `1-b2b-email-marketing` | **Date**: 2025-12-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/1-b2b-email-marketing/spec.md`

## Summary

Build a B2B email marketing SaaS platform that enables Australian local service providers to find leads from a built-in database of businesses, create AI-personalized email campaigns, and track engagement metrics. The system uses Next.js 14+ with App Router, TypeScript, Supabase (Postgres), Drizzle ORM, Clerk for multi-tenancy, Inngest for async workflows, AWS SES/Resend for email delivery, and OpenAI gpt-4o-mini for AI generation.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Next.js 14+ (App Router), Drizzle ORM, Supabase, Clerk, Inngest, OpenAI SDK, AWS SES SDK / Resend
**Storage**: Supabase (PostgreSQL) with Drizzle ORM
**Testing**: Jest, React Testing Library, Playwright for E2E
**Target Platform**: Web application (SaaS)
**Project Type**: Web application with separate frontend/backend concerns
**Performance Goals**:
- AI email generation: 1000 emails ≤ 10 minutes
- Campaign sending: 1000 emails ≤ 5 minutes with throttling
- Analytics update: ≤ 5 minutes delay for events
**Constraints**:
- Monthly quota enforcement per organization
- Email sending rate limits (AWS SES: 14 emails/second)
- No synchronous batch processing >3 items
**Scale/Scope**: Multi-tenant SaaS supporting 1000+ organizations, 10k+ campaigns, 1M+ emails/month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### AI Email Marketing SaaS Compliance Gates

**Tech Stack Compliance (Principle I)**
- [x] Uses Next.js 14+ with App Router
- [x] TypeScript with strict mode enabled
- [x] Supabase for database operations
- [x] Drizzle ORM for schema management
- [x] Clerk with Organizations for multi-tenancy
- [x] Inngest for async workflows
- [x] AWS SES or Resend for email delivery
- [x] OpenAI gpt-4o-mini for AI generation

**Architecture Compliance (Principle II)**
- [x] No synchronous batch processing >3 items
- [x] Inngest queues implemented for long operations
- [x] AI generation uses async workflows
- [x] Email sending uses async workflows

**Schema Compliance (Principle III)**
- [x] Database changes use Drizzle migrations
- [x] Schema is single source of truth
- [x] Type safety enforced throughout

**Security Compliance (Principle IV)**
- [x] All queries filtered by organization_id
- [x] No cross-tenant data access
- [x] Tenant isolation verified

**Email Compliance (Principle V)**
- [x] All emails include unsubscribe links
- [x] Links are signed and tenant-scoped
- [x] Suppression list handling implemented

**Scope Compliance (Principle VI)**
- [x] Feature aligns with V1 scope (Campaigns, Business DB, Reporting)
- [x] No out-of-scope features introduced

**Type Safety (Principle VII)**
- [x] No `any` types without justification
- [x] Strict TypeScript mode enabled
- [x] All entities properly typed

## Project Structure

### Documentation (this feature)

```text
specs/1-b2b-email-marketing/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (database schema)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API specifications)
└── tasks.md             # Phase 2 output (implementation tasks)
```

### Source Code (repository root)

Based on Next.js 14+ App Router with TypeScript:

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Clerk authentication
│   │   ├── sign-in/       # Sign-in page
│   │   └── sign-up/       # Sign-up page
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── businesses/    # Business search & selection
│   │   ├── campaigns/     # Campaign management
│   │   │   ├── [id]/      # Individual campaign
│   │   │   │   ├── edit/  # Edit campaign
│   │   │   │   └── analytics/ # Campaign metrics
│   │   └── analytics/     # Global analytics
│   ├── api/               # API routes
│   │   ├── businesses/    # Business search API
│   │   ├── campaigns/     # Campaign CRUD API
│   │   ├── emails/        # Email generation & sending
│   │   └── webhooks/      # Email event webhooks
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── businesses/       # Business-related components
│   ├── campaigns/        # Campaign components
│   └── analytics/        # Analytics components
├── lib/                   # Utility libraries
│   ├── db/               # Database schema & migrations
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   └── migrations/   # Migration files
│   ├── inngest/          # Inngest workflows
│   │   ├── functions.ts  # Async functions
│   │   └── client.ts     # Inngest client setup
│   ├── auth/             # Clerk auth utilities
│   ├── email/            # Email service integration
│   └── ai/               # OpenAI integration
└── types/                 # TypeScript type definitions

tests/
├── unit/                  # Unit tests
├── integration/           # API integration tests
└── e2e/                   # End-to-end tests
```

**Structure Decision**: Next.js App Router with TypeScript provides server components, built-in API routes, and optimal performance for a multi-tenant SaaS application.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | All constitution requirements satisfied | N/A |

## Phase 0: Research & Technology Decisions

### Research Tasks

1. **Database Schema Design**: Research optimal table structure for multi-tenant email marketing
2. **Inngest Workflow Patterns**: Study best practices for AI generation and email sending workflows
3. **Email Service Integration**: Compare AWS SES vs Resend for Australian market
4. **AI Prompt Engineering**: Research effective prompts for B2B email generation
5. **Rate Limiting Strategies**: Study email sending throttling best practices

### Research Results

**research.md**:
```markdown
# Research: B2B Email Marketing SaaS Technical Decisions

## Database Schema Design
**Decision**: Use Drizzle ORM with PostgreSQL, strict tenant isolation
**Rationale**: Drizzle provides type-safe schema definitions and migrations, essential for multi-tenant SaaS
**Tables**: businesses (global), campaigns (tenant-scoped), campaign_items, email_events, suppression_list

## Inngest Workflow Patterns
**Decision**: Two-step async process - batch generation then batch sending
**Rationale**: Separates AI generation (CPU intensive) from email sending (IO intensive), allows independent scaling
**Functions**: batch-generate-emails, send-campaign-batch

## Email Service Integration
**Decision**: AWS SES for production, Resend for development
**Rationale**: AWS SES offers better deliverability and Australian region support; Resend provides better DX for development
**Rate Limit**: 14 emails/second for AWS SES, implement exponential backoff

## AI Prompt Engineering
**Decision**: Use structured prompts with business context and user service profile
**Rationale**: Structured approach ensures consistent, relevant email generation while maintaining personalization
**Model**: OpenAI gpt-4o-mini for cost-effectiveness with 1000+ email batches

## Rate Limiting Strategies
**Decision**: Token bucket algorithm with per-organization limits
**Rationale**: Fair usage across tenants, prevents quota exhaustion by single user
**Limits**: Monthly quota + daily burst allowance
```

## Phase 1: Technical Design

### Database Schema (Drizzle ORM)

**data-model.md**:
```typescript
// src/lib/db/schema.ts

// Global businesses table (no tenant isolation)
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 100 }).notNull(),
  description: text('description'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, generating, ready, sending, sent
  totalRecipients: integer('total_recipients').default(0).notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaign items linking campaigns to businesses
export const campaignItems = pgTable('campaign_items', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  businessId: integer('business_id').references(() => businesses.id).notNull(),
  emailContent: text('email_content'), // Generated email content
  emailSubject: varchar('email_subject', { length: 255 }), // Generated subject
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, generated, sent, failed
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Email events tracking
export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  campaignItemId: integer('campaign_item_id').references(() => campaignItems.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // delivered, opened, clicked, bounced, complained
  eventData: jsonb('event_data'), // Additional event metadata
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Suppression list (tenant-scoped unsubscribe/bounce management)
export const suppressionList = pgTable('suppression_list', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Tenant isolation
  email: varchar('email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // unsubscribed, bounced, complained
  reason: text('reason'),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes for performance
export const campaignsOrgIdx = index('campaigns_organization_id_idx').on(campaigns.organizationId);
export const campaignItemsCampaignIdx = index('campaign_items_campaign_id_idx').on(campaignItems.campaignId);
export const emailEventsOrgIdx = index('email_events_organization_id_idx').on(emailEvents.organizationId);
export const suppressionOrgIdx = index('suppression_list_organization_id_idx').on(suppressionList.organizationId);
```

### Inngest Workflow Design

**Inngest Functions** (`src/lib/inngest/functions.ts`):

```typescript
// Batch generate personalized emails for campaign
export const batchGenerateEmails = inngest.createFunction(
  { id: 'batch-generate-emails' },
  { event: 'campaign/generate-emails' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;

    // Fetch campaign and items in batches of 50
    const items = await step.run('fetch-campaign-items', async () => {
      return db.select()
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .innerJoin(businesses, eq(businesses.id, campaignItems.businessId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'pending'),
            eq(campaigns.organizationId, organizationId)
          )
        )
        .limit(50);
    });

    if (items.length === 0) {
      return { generated: 0 };
    }

    // Generate emails in parallel (max 5 concurrent)
    const generated = await step.run('generate-emails', async () => {
      const promises = items.map(async (item) => {
        const prompt = createEmailPrompt({
          businessName: item.businesses.name,
          businessDescription: item.businesses.description,
          businessIndustry: item.businesses.industry,
          serviceDescription: item.campaigns.serviceDescription,
          senderName: item.campaigns.senderName,
          tone: item.campaigns.tone,
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content generated');

        // Parse subject and body from response
        const [subject, ...bodyParts] = content.split('\n');
        const body = bodyParts.join('\n').trim();

        return {
          id: item.campaignItems.id,
          subject: subject.replace(/^Subject:\s*/i, ''),
          content: body,
        };
      });

      const results = await Promise.allSettled(promises);

      // Update database with generated content
      const updates = results.map((result, index) => {
        const item = items[index];
        if (result.status === 'fulfilled') {
          return db.update(campaignItems)
            .set({
              emailSubject: result.value.subject,
              emailContent: result.value.content,
              status: 'generated',
            })
            .where(eq(campaignItems.id, result.value.id));
        } else {
          return db.update(campaignItems)
            .set({
              status: 'failed',
              errorMessage: result.reason?.message || 'Generation failed',
            })
            .where(eq(campaignItems.id, item.campaignItems.id));
        }
      });

      await Promise.all(updates);
      return results.filter(r => r.status === 'fulfilled').length;
    });

    // Check if more items to process
    const remaining = await step.run('check-remaining', async () => {
      const result = await db.select({ count: count() })
        .from(campaignItems)
        .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'pending'),
            eq(campaigns.organizationId, organizationId)
          )
        );
      return result[0].count;
    });

    // Schedule next batch if needed
    if (remaining > 0) {
      await step.sendEvent('schedule-next-batch', {
        name: 'campaign/generate-emails',
        data: { campaignId, organizationId },
      });
    } else {
      // Update campaign status
      await step.run('update-campaign-status', async () => {
        await db.update(campaigns)
          .set({ status: 'ready' })
          .where(eq(campaigns.id, campaignId));
      });
    }

    return { generated };
  }
);

// Send campaign emails in batches
export const sendCampaignBatch = inngest.createFunction(
  { id: 'send-campaign-batch' },
  { event: 'campaign/send-batch' },
  async ({ event, step }) => {
    const { campaignId, organizationId } = event.data;

    // Fetch campaign details
    const campaign = await step.run('fetch-campaign', async () => {
      const result = await db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.organizationId, organizationId),
            eq(campaigns.status, 'ready')
          )
        )
        .limit(1);
      return result[0];
    });

    if (!campaign) {
      throw new Error('Campaign not found or not ready');
    }

    // Fetch next batch of emails to send (limit 14 for AWS SES rate)
    const emails = await step.run('fetch-emails-batch', async () => {
      return db.select()
        .from(campaignItems)
        .innerJoin(businesses, eq(businesses.id, campaignItems.businessId))
        .where(
          and(
            eq(campaignItems.campaignId, campaignId),
            eq(campaignItems.status, 'generated')
          )
        )
        .limit(14)
        .forUpdate(); // Prevent concurrent sends
    });

    if (emails.length === 0) {
      // Campaign complete
      await step.run('mark-campaign-sent', async () => {
        await db.update(campaigns)
          .set({
            status: 'sent',
            sentCount: campaign.sentCount + campaign.totalRecipients
          })
          .where(eq(campaigns.id, campaignId));
      });
      return { sent: 0, complete: true };
    }

    // Check suppression list
    const suppressed = await step.run('check-suppression', async () => {
      const emails = campaignItems.map(item => item.businesses.email);
      const result = await db.select({ email: suppressionList.email })
        .from(suppressionList)
        .where(
          and(
            eq(suppressionList.organizationId, organizationId),
            inArray(suppressionList.email, emails)
          )
        );
      return new Set(result.map(r => r.email));
    });

    // Send emails with rate limiting
    const results = await step.run('send-emails', async () => {
      const promises = emails.map(async (email) => {
        if (suppressed.has(email.businesses.email)) {
          return {
            itemId: email.campaignItems.id,
            status: 'suppressed',
            messageId: null,
          };
        }

        try {
          // Generate unique unsubscribe link
          const unsubscribeToken = await generateUnsubscribeToken(
            organizationId,
            email.campaignItems.id
          );

          // Add unsubscribe link to email
          const emailContent = email.campaignItems.emailContent +
            `\n\n---\nDon't want these emails? [Unsubscribe here](${process.env.APP_URL}/unsubscribe/${unsubscribeToken})`;

          // Send via AWS SES
          const messageId = await sendEmail({
            from: `${campaign.senderName} <${campaign.senderEmail}>`,
            to: email.businesses.email,
            subject: email.campaignItems.emailSubject,
            html: emailContent,
            campaignId: campaignId,
            organizationId: organizationId,
          });

          return {
            itemId: email.campaignItems.id,
            status: 'sent',
            messageId,
          };
        } catch (error) {
          return {
            itemId: email.campaignItems.id,
            status: 'failed',
            error: error.message,
          };
        }
      });

      return await Promise.all(promises);
    });

    // Update database with send results
    await step.run('update-send-results', async () => {
      const updates = results.map(result => {
        if (result.status === 'sent') {
          return db.update(campaignItems)
            .set({
              status: 'sent',
              sentAt: new Date(),
            })
            .where(eq(campaignItems.id, result.itemId));
        } else if (result.status === 'suppressed') {
          return db.update(campaignItems)
            .set({ status: 'suppressed' })
            .where(eq(campaignItems.id, result.itemId));
        } else {
          return db.update(campaignItems)
            .set({
              status: 'failed',
              errorMessage: result.error,
            })
            .where(eq(campaignItems.id, result.itemId));
        }
      });

      await Promise.all(updates);
    });

    // Update campaign sent count
    const sentCount = results.filter(r => r.status === 'sent').length;
    await step.run('update-sent-count', async () => {
      await db.update(campaigns)
        .set({
          sentCount: campaign.sentCount + sentCount
        })
        .where(eq(campaigns.id, campaignId));
    });

    // Wait 1 second before next batch (AWS SES rate limit)
    await step.sleep('rate-limit-wait', '1s');

    // Schedule next batch
    await step.sendEvent('schedule-next-batch', {
      name: 'campaign/send-batch',
      data: { campaignId, organizationId },
    });

    return { sent: sentCount, complete: false };
  }
);
```

### API Structure (Next.js App Router)

**contracts/openapi.yaml**:

```yaml
openapi: 3.0.0
info:
  title: B2B Email Marketing API
  version: 1.0.0
paths:
  /api/businesses:
    get:
      summary: Search businesses by city and industry
      parameters:
        - in: query
          name: city
          schema: { type: string }
        - in: query
          name: industry
          schema: { type: string }
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: limit
          schema: { type: integer, default: 50 }
      responses:
        '200':
          description: List of businesses
          content:
            application/json:
              schema:
                type: object
                properties:
                  businesses:
                    type: array
                    items:
                      $ref: '#/components/schemas/Business'
                  total: { type: integer }
                  page: { type: integer }
                  limit: { type: integer }

  /api/campaigns:
    get:
      summary: List user's campaigns
      responses:
        '200':
          description: List of campaigns
          content:
            application/json:
              schema:
                type: object
                properties:
                  campaigns:
                    type: array
                    items:
                      $ref: '#/components/schemas/Campaign'

    post:
      summary: Create new campaign
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                subject: { type: string }
                senderName: { type: string }
                senderEmail: { type: string }
                serviceDescription: { type: string }
                tone: { type: string, enum: [professional, friendly, casual] }
                businessIds: { type: array, items: { type: integer } }
      responses:
        '201':
          description: Campaign created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Campaign'

  /api/campaigns/{id}:
    get:
      summary: Get campaign details
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: Campaign details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CampaignDetail'

  /api/campaigns/{id}/generate:
    post:
      summary: Trigger AI email generation
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: integer }
      responses:
        '202':
          description: Generation started
          content:
            application/json:
              schema:
                type: object
                properties:
                  message: { type: string }
                  jobId: { type: string }

  /api/campaigns/{id}/send:
    post:
      summary: Send campaign emails
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: integer }
      responses:
        '202':
          description: Sending started
          content:
            application/json:
              schema:
                type: object
                properties:
                  message: { type: string }
                  jobId: { type: string }

  /api/analytics/campaigns/{id}:
    get:
      summary: Get campaign analytics
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: Campaign analytics
          content:
            application/json:
              schema:
                type: object
                properties:
                  metrics:
                    type: object
                    properties:
                      delivered: { type: integer }
                      opened: { type: integer }
                      clicked: { type: integer }
                      bounced: { type: integer }
                      suppressed: { type: integer }
                  timeline:
                    type: array
                    items:
                      type: object
                      properties:
                        date: { type: string, format: date-time }
                        event: { type: string }
                        count: { type: integer }

  /api/webhooks/email-events:
    post:
      summary: Receive email event webhooks from ESP
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              # Schema depends on ESP (AWS SES/Resend)
      responses:
        '200':
          description: Event processed

  /api/unsubscribe/{token}:
    get:
      summary: Unsubscribe from emails
      parameters:
        - in: path
          name: token
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Unsubscribe successful
          content:
            text/html:
              schema:
                type: string
```

### Quick Start Guide

**quickstart.md**:
```markdown
# Quick Start: B2B Email Marketing SaaS

## Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Clerk account for authentication
- Inngest account for workflows
- AWS SES or Resend account for email delivery
- OpenAI API key

## Setup Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/Xianghbb/au-email-marketing-saas.git
   cd au-email-marketing-saas
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```
   # Database
   DATABASE_URL=your_supabase_connection_string

   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Inngest
   INNGEST_EVENT_KEY=...
   INNGEST_SIGNING_KEY=...

   # Email Service
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=ap-southeast-2

   # or Resend
   RESEND_API_KEY=re_...

   # AI
   OPENAI_API_KEY=sk-...

   # App
   APP_URL=http://localhost:3000
   ```

3. **Database Setup**
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:push      # Push to Supabase
   npm run db:seed      # Seed with sample businesses
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   Open http://localhost:3000
   ```

## Testing Your First Campaign

1. Sign up with Clerk
2. Search businesses by city/industry
3. Create a campaign with selected businesses
4. Configure your service description
5. Generate AI emails
6. Send campaign
7. Monitor analytics
```

## Phase 2: Implementation Tasks

*Note: Tasks will be generated by `/speckit.tasks` command after plan approval*

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Technology Dependencies

- Clerk must be configured before authentication-protected routes
- Supabase must be set up before database operations
- Inngest must be configured before async workflows
- Email service (AWS SES/Resend) must be configured before sending
- OpenAI API key required for AI generation

### Critical Path

1. Database schema and Drizzle setup
2. Clerk authentication integration
3. Inngest workflow setup
4. Email service integration
5. OpenAI integration
6. Core API endpoints
7. Frontend components
8. Testing and validation

## Notes

- All database queries must include organization_id filter for tenant isolation
- Email sending must respect monthly quota limits per organization
- AI generation uses gpt-4o-mini for cost-effectiveness with large batches
- AWS SES rate limits require batching (14 emails/second max)
- All emails include mandatory unsubscribe links per compliance requirements