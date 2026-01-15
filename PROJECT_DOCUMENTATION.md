# B2B Email Marketing SaaS - Project Documentation

## Overview

An AI-powered email marketing platform designed for Australian B2B businesses to create, manage, and send personalized cold email campaigns to business leads using OpenAI for email generation and Resend for email delivery.

---

## Technology Stack

| Category           | Technology                        | Version |
| ------------------ | --------------------------------- | ------- |
| Frontend           | Next.js 14 (React 18), TypeScript | 14.2.25 |
| Styling            | Tailwind CSS, Shadcn/ui           | 4.x     |
| Backend            | Next.js API Routes, Node.js       | -       |
| Primary Database   | PostgreSQL (Drizzle ORM)          | 0.45.0  |
| Secondary Database | Supabase (leads data)             | 2.86.2  |
| Authentication     | Clerk                             | 6.35.6  |
| Email Delivery     | Resend                            | 6.5.2   |
| AI Generation      | OpenAI                            | 6.10.0  |
| Background Jobs    | Inngest                           | 3.46.0  |
| State Management   | TanStack React Query              | 5.90.12 |
| Data Tables        | AG Grid Community                 | 35.0.0  |
| Validation         | Zod                               | 4.1.13  |

---

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Authentication routes
│   │   ├── sign-in/                  # Clerk sign-in page
│   │   └── sign-up/                  # Clerk sign-up page
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── analytics/                # Campaign analytics
│   │   ├── campaigns/                # Campaign management (CRUD)
│   │   ├── collections/              # User's saved lead collections
│   │   ├── leads/                    # Lead search and filtering
│   │   ├── overview/                 # Dashboard home
│   │   └── settings/                 # User settings
│   ├── api/                          # API endpoints
│   │   ├── analytics/                # Analytics endpoints
│   │   ├── campaigns/                # Campaign CRUD
│   │   ├── businesses/               # Business search
│   │   ├── inngest/                  # Background job webhook
│   │   ├── suppression/              # Suppression list management
│   │   ├── quota/                    # Quota tracking
│   │   └── webhooks/                 # Email event webhooks
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
│
├── components/                       # React Components
│   ├── ui/                           # Shadcn/ui base components
│   ├── dashboard/                    # Dashboard layout components
│   ├── campaigns/                    # Campaign-related components
│   ├── leads/                        # Lead table & filter components
│   ├── collections/                  # Collection management
│   ├── quota/                        # Quota display components
│   └── providers/                    # Context providers
│
├── lib/                              # Utilities & Services
│   ├── db/                           # Database layer
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   ├── index.ts                  # DB client initialization
│   │   ├── supabase.ts               # Supabase clients
│   │   ├── repository.ts             # Data access layer
│   │   └── migrations/               # SQL migration files
│   ├── services/                     # Business logic
│   │   ├── campaign.ts               # Campaign operations
│   │   ├── business.ts               # Business search
│   │   ├── email.ts                  # Email sending
│   │   ├── quota.ts                  # Quota management
│   │   ├── analytics.ts              # Metrics & analytics
│   │   └── suppression.ts            # Suppression list
│   ├── inngest/                      # Background jobs
│   │   ├── client.ts                 # Inngest client
│   │   └── functions/                # Job definitions
│   ├── auth/                         # Authentication utilities
│   ├── email/                        # Email handling
│   │   ├── resend.ts                 # Resend integration
│   │   └── templates/                # Email templates
│   └── ai/                           # AI integration
│       └── openai.ts                 # OpenAI client
│
├── hooks/                            # React hooks
└── middleware.ts                     # Auth middleware

Configuration Files:
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── next.config.mjs                   # Next.js config
├── drizzle.config.ts                 # Drizzle ORM config
├── tailwind.config.ts                # Tailwind CSS config
└── components.json                   # Shadcn/ui config
```

---

## Database Schema

### Primary Database (PostgreSQL)

| Table                | Description                                     | Tenant-Scoped |
| -------------------- | ----------------------------------------------- | ------------- |
| `businesses`         | Global business directory (Yellow Pages data)   | No            |
| `campaigns`          | Email campaigns                                 | Yes           |
| `campaignItems`      | Individual recipients in campaigns              | Yes           |
| `emailEvents`        | Email event tracking (delivered/opened/clicked) | Yes           |
| `targetLists`        | User-created business target lists              | Yes           |
| `targetListItems`    | Links target lists to businesses                | Yes           |
| `suppressionList`    | Unsubscribe/bounce/complaint management         | Yes           |
| `organizationQuotas` | Email quota tracking (1000/month default)       | Yes           |
| `userPreferences`    | User account settings                           | Yes           |
| `collections`        | User's saved lead collections                   | User-scoped   |
| `collectionItems`    | Links collections to businesses                 | User-scoped   |

### Secondary Database (Supabase - Read-only)

| Table                    | Description                         |
| ------------------------ | ----------------------------------- |
| `rawdata_yellowpage_new` | 100k+ Australian business directory |

---

## API Endpoints

### Campaign Management

| Method | Endpoint                    | Description                    |
| ------ | --------------------------- | ------------------------------ |
| POST   | `/api/campaigns`            | Create new campaign            |
| GET    | `/api/campaigns`            | List campaigns with pagination |
| GET    | `/api/campaigns/[id]`       | Get campaign details           |
| POST   | `/api/campaigns/[id]/start` | Start email generation         |
| POST   | `/api/campaigns/[id]/send`  | Send campaign emails           |
| GET    | `/api/campaigns/[id]/items` | Get campaign recipients        |

### Business Search

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/businesses` | Search/filter businesses |

### Analytics

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/api/analytics`                | Organization-wide metrics |
| GET    | `/api/analytics/campaigns/[id]` | Campaign-specific metrics |

### Email Management

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| POST   | `/api/suppression`           | Manage suppression list |
| GET    | `/api/quota`                 | Get quota status        |
| POST   | `/api/unsubscribe/[token]`   | Handle unsubscribe      |
| POST   | `/api/webhooks/email-events` | Resend webhook          |

---

## Key Features

### 1. Lead Search & Management

- Search 100k+ Australian businesses from Yellow Pages data
- Filter by city, industry, and company name
- Server-side pagination (50 items/page)
- Multi-select for bulk operations
- Save leads to collections for later use

### 2. Campaign Creation

- Create campaigns with custom service descriptions
- Select recipients from collections or enter manually
- Choose email tone: Professional, Friendly, Casual, Formal, Enthusiastic
- AI-powered email generation using OpenAI

### 3. Email Delivery

- Send emails via Resend with delivery tracking
- Automatic suppression list checking
- Rate limiting and quota management
- Unsubscribe link with JWT token validation

### 4. Analytics & Tracking

- Real-time email event tracking (delivered, opened, clicked, bounced)
- Campaign-specific metrics (open rate, click rate, bounce rate)
- Organization-wide metrics and quota usage
- Suppression list for unsubscribes and complaints

### 5. Multi-Tenancy

- Clerk-based authentication with organization support
- Data isolation by organization ID
- Per-organization quota management (1000 emails/month default)

---

## Background Jobs (Inngest)

| Job                   | Description                               |
| --------------------- | ----------------------------------------- |
| `batchGenerateEmails` | Generate personalized emails using OpenAI |
| `sendCampaignBatch`   | Send emails via Resend in batches         |
| `resetMonthlyQuotas`  | Monthly quota reset (cron)                |

---

## Current Implementation Progress

### Completed Features

- [x] User authentication with Clerk
- [x] Business lead search with pagination and filtering
- [x] Lead collection management (save to collections)
- [x] Campaign CRUD operations
- [x] Campaign recipient selection (collection or manual)
- [x] Email generation with OpenAI (5 tone options)
- [x] Email sending via Resend with delivery tracking
- [x] Email event webhooks (delivered/opened/clicked/bounced/complained)
- [x] Suppression list management
- [x] Email quota tracking per organization
- [x] Campaign analytics (metrics, rates)
- [x] Multi-tenant data isolation
- [x] Responsive dashboard UI
- [x] AG Grid for data tables
- [x] Server-side pagination for leads
- [x] Hybrid database structure (PostgreSQL + Supabase)

### In Progress / Partial

- [ ] Settings page (placeholder - under construction)
- [ ] Advanced analytics visualizations
- [ ] Email template customization

### Known Limitations

- Production builds configured to ignore TypeScript/ESLint errors
- Manual database migration approach
- Limited email template customization options

---

## Recent Git History

| Commit    | Description                                |
| --------- | ------------------------------------------ |
| `6636e51` | Merge PR #11 - B2B email marketing feature |
| `43c5a8c` | Sync schema with hybrid DB structure       |
| `65ee4b0` | Remove FK constraints for external leads   |
| `1d70717` | Merge PR #10 - B2B email marketing         |
| `5036105` | Server-side pagination + filter fixes      |

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_COMPANY_DB_URL=https://...supabase.co
NEXT_PUBLIC_COMPANY_DB_ANON_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication (Clerk)
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# AI & Email
OPENAI_API_KEY=...
RESEND_API_KEY=...
FROM_NAME=...
FROM_EMAIL=...

# Background Jobs
INNGEST_EVENT_KEY=...

# Security
JWT_SECRET=...
```

---

## How to Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Leads     │  │  Campaigns  │  │  Analytics  │              │
│  │   Page      │  │    Page     │  │    Page     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    React Query                                   │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                      API ROUTES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ /businesses │  │ /campaigns  │  │ /analytics  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Business   │  │  Campaign   │  │  Analytics  │              │
│  │  Service    │  │  Service    │  │  Service    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Email     │  │   Quota     │  │ Suppression │              │
│  │  Service    │  │  Service    │  │  Service    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────┼───────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐
│  PostgreSQL   │  │   Supabase    │  │   Inngest     │
│  (Campaigns,  │  │  (100k+ Leads │  │  (Background  │
│   Events,     │  │   Yellow      │  │   Jobs)       │
│   Quotas)     │  │   Pages)      │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐
│    OpenAI     │  │    Resend     │  │    Clerk      │
│  (Email Gen)  │  │  (Delivery)   │  │    (Auth)     │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## Summary

This B2B Email Marketing SaaS is a well-structured, modern full-stack application with:

- **Robust multi-tenancy** for organization-level data isolation
- **Comprehensive email campaign management** from lead selection to analytics
- **AI-powered content generation** for personalized cold emails
- **Scalable architecture** using background job processing with Inngest
- **Hybrid database approach** combining PostgreSQL for app data and Supabase for leads

The project is approximately **85% complete** with core functionality fully implemented. Remaining work includes settings page completion, advanced analytics visualizations, and email template customization.
