# Research: B2B Email Marketing SaaS Technical Decisions

**Date**: 2025-12-05
**Feature**: B2B Email Marketing SaaS for Australian Local Service Providers

## Database Schema Design

**Decision**: Use Drizzle ORM with PostgreSQL, implement strict tenant isolation with organization_id on all tenant-facing tables

**Rationale**:
- Drizzle provides type-safe schema definitions and migrations, essential for multi-tenant SaaS
- PostgreSQL offers robust JSON support for email event data and full-text search for business filtering
- Tenant isolation via organization_id prevents data leakage between organizations

**Implementation**:
- Global `businesses` table (no organization_id) - shared across all tenants
- All campaign-related tables include organization_id for strict isolation
- Composite indexes on (organization_id, id) for optimal query performance

## Inngest Workflow Patterns

**Decision**: Two-step async process - batch generation then batch sending

**Rationale**:
- Separates AI generation (CPU intensive, 10+ minutes for 1000 emails) from email sending (IO intensive)
- Allows independent scaling - can run multiple generation workers vs single sending worker with rate limits
- Provides better error handling - generation failures don't block sending, sending failures don't regenerate

**Functions**:
- `batch-generate-emails`: Processes 50 emails at a time, schedules next batch if more pending
- `send-campaign-batch`: Sends 14 emails per second (AWS SES limit), includes rate limiting wait

## Email Service Integration

**Decision**: AWS SES for production, Resend for development

**Rationale**:
- AWS SES offers better deliverability (dedicated IP options) and Australian region support (ap-southeast-2)
- Lower cost at scale ($0.10 per 1000 emails vs $0.20 for Resend)
- Resend provides better developer experience with modern API and webhooks for development

**Configuration**:
- Production: AWS SES with dedicated IP, SPF/DKIM configured
- Development: Resend with test API keys
- Rate limiting: 14 emails/second (AWS SES default), exponential backoff on errors

## AI Prompt Engineering

**Decision**: Use structured prompts with business context and user service profile

**Rationale**:
- Structured approach ensures consistent, relevant email generation while maintaining personalization
- Separate system prompt for tone/style, user prompt for business-specific content
- JSON output format for reliable parsing of subject and body

**Model Selection**: OpenAI gpt-4o-mini
- Cost-effective for bulk generation (1000+ emails)
- Adequate quality for B2B cold emails
- Fast inference (2-3 seconds per email)

**Prompt Structure**:
```
System: "You are a professional B2B email writer. Create personalized cold emails that are concise, relevant, and include a clear call-to-action."

User: "Write an email from {senderName} at {senderCompany} to {businessName} in {industry}.
Their business: {businessDescription}
Our service: {serviceDescription}
Tone: {tone}
Include: Personalized opener, value proposition, soft CTA"

Response format: "Subject: [subject]\n[email body]"
```

## Rate Limiting Strategies

**Decision**: Token bucket algorithm with per-organization limits

**Rationale**:
- Fair usage across tenants prevents quota exhaustion by single user
- Burst allowance for immediate small campaigns
- Monthly reset based on billing cycle

**Implementation**:
- Monthly quota: Hard limit enforced at campaign creation
- Daily burst: 10% of monthly quota available immediately
- Email sending: 14/second per organization (AWS SES limit)
- AI generation: 5 concurrent requests per organization

## Security Considerations

**Decision**: JWT-based unsubscribe tokens with organization_id and campaign_item_id

**Rationale**:
- Stateless verification without database lookups
- Includes organization context for immediate suppression
- Time-limited (90 days) to prevent replay attacks

**Token Structure**:
- Payload: {organizationId, campaignItemId, email, exp}
- Signed with organization-specific secret
- One-click unsubscribe with immediate effect

## Performance Optimizations

**Decision**: Database indexes, connection pooling, and caching strategy

**Rationale**:
- Composite indexes on (organization_id, status) for campaign queries
- Connection pooling via Supabase (200 connections max)
- Redis caching for quota checks and suppression lists
- Pagination with cursor-based navigation for large datasets

**Specific Optimizations**:
- Index on businesses(city, industry) for fast filtering
- Index on email_events(organization_id, event_type, occurred_at) for analytics
- Materialized view for campaign metrics with 5-minute refresh
- Batch database operations (50 inserts at a time)

## Alternative Technologies Considered

1. **Database ORM**: Prisma vs Drizzle
   - Chose Drizzle for better TypeScript integration and smaller bundle size
   - Prisma has larger binary overhead and less flexible migrations

2. **Workflow Engine**: Temporal vs Inngest
   - Chose Inngest for better Next.js integration and simpler deployment
   - Temporal requires separate infrastructure and complex setup

3. **Email Service**: SendGrid vs AWS SES
   - SendGrid has better APIs but higher cost and no Australian region
   - AWS SES provides better deliverability and regional compliance

4. **AI Model**: Claude vs GPT-4o-mini
   - Claude has better reasoning but higher cost and slower inference
   - GPT-4o-mini provides adequate quality at 1/10th the cost