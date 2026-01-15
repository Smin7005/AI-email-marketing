# Project Handover Document
## AI Email Marketing Platform - SaaS Application

---

## 📋 Project Overview

**Project Name:** AI Email Marketing Platform - B2B Lead Generation & Email Campaign Management

**Repository:** `au-email-marketing-saas`

**Current Branch:** `1-b2b-email-marketing`

**Deployment URL:** [aiemailplatform.vercel.app](https://aiemailplatform.vercel.app/)

---

## 🛠️ Technology Stack

### Core Framework & Runtime
- **Next.js:** 14.2.25 (App Router)
- **React:** 18.2.0
- **TypeScript:** 5.x
- **Node.js:** 22.x

### UI & Styling
- **Tailwind CSS:** 4.x
- **Shadcn/ui:** Component library based on Radix UI
- **Radix UI:** Primitives (Popover, Select, Checkbox, Label, etc.)
- **AG Grid:** 35.x (Data table for leads/collections)
- **Lucide React:** Icon library
- **cmdk:** Command palette component

### Database & ORM
- **PostgreSQL:** Primary database
- **Drizzle ORM:** 0.45.x with postgres-js driver
- **Supabase:** Database hosting & management
- **Dual Database Architecture:**
  1. **User Database** (ctdrapmcjefjqhhdyalg.supabase.co) - User auth, preferences, quotas
  2. **Production Database** (zujqziqteggihirewuxf.supabase.co) - Business data (120k+ leads)

### Authentication & Authorization
- **Clerk:** User authentication & session management
- **Supabase Auth:** Additional auth layer (service role)

### Email & Communication
- **Resend:** Email sending service
- **AWS SES:** Backup email service (SDK v3)
- **Inngest:** Background job processing & email generation

### AI & External Services
- **OpenAI GPT:** Email content generation
- **Inngest:** Serverless function orchestration

### Development & Deployment
- **Vercel:** Primary deployment platform
- **Drizzle Kit:** Database schema management & migrations
- **ESLint & Prettier:** Code linting & formatting

---

## 🏗️ Architecture Overview

### Database Architecture

The application uses a **dual-database architecture** with a recent migration to **single-database for Collections**:

#### 1. User Database (ctdrapmcjefjqhhdyalg.supabase.co)
- **Purpose:** User authentication, organization management, campaign data
- **Tables:**
  - `campaigns` - Email campaigns (tenant-scoped by organization_id)
  - `campaign_items` - Individual email recipients
  - `email_events` - Email tracking (delivered, opened, clicked, bounced)
  - `suppression_list` - Unsubscribe/bounce management
  - `target_lists` & `target_list_items` - Lead groupings
  - `organization_quotas` - Usage tracking
  - `user_preferences` - User settings

#### 2. Production Database (zujqziqteggihirewuxf.supabase.co)
- **Purpose:** Business lead data (120k+ companies)
- **Tables:**
  - `rawdata_yellowpage_new` - Business directory (company_name, email, phone, address, industry)
  - `collections` - User-saved lead collections ✅ **Recently migrated here**
  - `collection_items` - Links collections to leads ✅ **Recently migrated here**

### Recent Migration: Collections Single-Database Architecture

**Status:** ✅ **COMPLETE** - Code deployed, awaiting SQL migration execution

**Problem Solved:**
- Previously: Hybrid architecture with manual array joins between databases
- Now: Single Production Database with SQL JOINs

**Migration Script:** `PRODUCTION_DB_COLLECTIONS_MIGRATION.sql`

**Key Benefits:**
- Eliminates BigInt serialization issues
- Better performance with database-level JOINs
- Simpler code architecture
- Proper foreign key constraints

**Data Flow:**
```
Leads (Production DB) → Collections (Production DB) → Campaigns (User DB)
                                ↓
                        SQL JOIN Query
                                ↓
                    All Data from Same DB
```

### Data Flow Architecture

```
User Authentication (Clerk)
    ↓
Dashboard Pages (Next.js App Router)
    ↓
API Routes (/src/app/api)
    ↓
Server Actions (/src/lib/actions) + Supabase Clients
    ↓
Dual Database Architecture
    ↓
Email Generation (OpenAI + Inngest)
    ↓
Email Delivery (Resend/SES)
```

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── campaigns/           # Campaign management
│   │   │   ├── create/          # Create campaign flow
│   │   │   └── [id]/           # Campaign detail & analytics
│   │   ├── collections/         # Lead collections
│   │   │   └── [id]/           # Collection detail view
│   │   ├── leads/              # Browse/search 120k+ leads
│   │   ├── overview/           # Dashboard home
│   │   ├── analytics/          # Campaign analytics
│   │   └── settings/           # User settings
│   ├── api/                    # API routes
│   │   ├── campaigns/          # Campaign CRUD
│   │   ├── collections/         # Collections CRUD ✅
│   │   ├── businesses/          # Lead data access
│   │   ├── analytics/           # Analytics endpoints
│   │   ├── suppression/        # Unsubscribe management
│   │   ├── quota/             # Usage tracking
│   │   ├── webhooks/          # Email service webhooks
│   │   └── inngest/           # Background job endpoints
│   └── sign-in/               # Auth pages
│
├── components/                 # Reusable UI components
│   ├── ui/                    # Shadcn/ui components
│   │   ├── select.tsx         # Lead/collection selection ✅
│   │   ├── popover.tsx        # Dropdown overlays
│   │   ├── command.tsx        # Command palette
│   │   ├── combobox.tsx       # Searchable select (⚠️ stability issues)
│   │   ├── checkbox.tsx       # Multi-select
│   │   └── ...
│   └── collections/           # Collection-specific components
│       └── CollectionItemsTable.tsx  # AG Grid table ✅
│
├── lib/                       # Business logic & utilities
│   ├── db/                    # Database configuration
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── supabase.ts       # User DB client
│   │   ├── company-client.ts  # Production DB client ✅
│   │   ├── pool.ts           # Connection pooling
│   │   └── migrations/       # Database migrations
│   ├── actions/              # Server actions
│   │   └── collections.ts    # Collection operations ✅
│   ├── auth/                 # Auth utilities
│   ├── ai/                   # OpenAI integration
│   ├── email/               # Email service wrappers
│   └── services/            # External service clients
│
├── inngest/                  # Background job functions
│   └── functions/
│       └── generate-emails.ts  # AI email generation (TODO: email sending)
│
└── ...
```

---

## 🎯 Key Features

### 1. Lead Management
**Location:** `/src/app/(dashboard)/leads`

**Functionality:**
- Browse 120k+ business leads from Production Database
- **AG Grid** for high-performance data display
- Filters: Industry, Location, Company Size
- Search by company name, email, or phone
- Select leads for collection or campaign

**Key Files:**
- `src/app/api/businesses/route.ts` - Lead data API
- `src/app/(dashboard)/leads/page.tsx` - Main leads page

### 2. Collections (Recently Completed)
**Location:** `/src/app/(dashboard)/collections`

**Functionality:**
- Create named collections of leads
- Add/remove leads from collections
- View collection details in AG Grid table
- Use collections in campaign creation
- **Status:** ✅ Fully implemented, migrated to single-DB architecture

**Key Files:**
- `src/app/api/collections/route.ts` - Collections API
- `src/app/(dashboard)/collections/[id]/page.tsx` - Collection detail
- `src/components/collections/CollectionItemsTable.tsx` - Table component
- `src/app/actions/collections.ts` - Collection server actions
- `src/lib/actions/collections.ts` - Collection operations

**Migration:** `PRODUCTION_DB_COLLECTIONS_MIGRATION.sql` ⚠️ **Must be executed in Supabase Production DB**

### 3. Campaign Management
**Location:** `/src/app/(dashboard)/campaigns`

**Functionality:**
- Create email campaigns from leads/collections
- AI-powered email content generation (OpenAI GPT)
- Multiple tones: Professional, Casual, Friendly, Formal
- Track delivery, opens, clicks, bounces
- Campaign status: Draft → Generating → Ready → Sending → Sent

**Key Files:**
- `src/app/api/campaigns/` - Campaign CRUD endpoints
- `src/app/(dashboard)/campaigns/create/page.tsx` - Creation flow
- `src/app/(dashboard)/campaigns/[id]/page.tsx` - Campaign detail

### 4. Analytics & Tracking
**Location:** `/src/app/(dashboard)/analytics`

**Functionality:**
- Campaign performance metrics
- Email delivery tracking
- Open/click rate analytics
- Bounce and suppression tracking

**Key Files:**
- `src/app/api/analytics/` - Analytics endpoints
- `src/app/api/webhooks/email-events` - Email service webhooks

### 5. Background Job Processing
**Framework:** Inngest

**Functions:**
- Email content generation using OpenAI
- Email delivery orchestration
- Campaign status updates

**Key Files:**
- `src/inngest/functions/generate-emails.ts`
- `src/app/api/inngest/route.ts`

---

## 🔧 Environment Setup

### Required Environment Variables

Create `.env.local` based on `.env.local.template`:

```bash
# ==========================================
# Authentication
# ==========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ==========================================
# Database 1: User Database
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://ctdrapmcjefjqhhdyalg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ==========================================
# Database 2: Production Database (Leads)
# ==========================================
NEXT_PUBLIC_COMPANY_DB_URL="https://zujqziqteggihirewuxf.supabase.co"
NEXT_PUBLIC_COMPANY_DB_ANON_KEY="eyJ..."

# ==========================================
# Email Service
# ==========================================
RESEND_API_KEY=re_...
FROM_EMAIL=your-verified-email@yourdomain.com
FROM_NAME="Your Business Name"

# ==========================================
# AI & Background Jobs
# ==========================================
OPENAI_API_KEY=sk-proj-...
INNGEST_EVENT_KEY=ZC-...
INNGEST_SIGNING_KEY=signkey-...

# ==========================================
# Application
# ==========================================
APP_URL=http://localhost:3000
```

### Database Migrations

**Run migrations:**
```bash
npm run db:migrate
```

**Generate Drizzle types:**
```bash
npm run db:gen-types
```

**Access Drizzle Studio:**
```bash
npm run db:studio
```

---

## 🚀 Current Status & Known Issues

### ✅ Completed Features
- [x] User authentication (Clerk)
- [x] Lead browsing & filtering (AG Grid)
- [x] Collections feature (fully functional)
- [x] Campaign creation & management
- [x] AI email generation (OpenAI)
- [x] Email delivery (Resend/SES)
- [x] Email tracking & analytics
- [x] Suppression list management
- [x] Organization quotas

### ⚠️ Known Issues & TODOs

#### 1. **Collections Database Migration** - ⚠️ **CRITICAL**
- **Status:** Code deployed, SQL migration pending execution
- **Action Required:** Execute `PRODUCTION_DB_COLLECTIONS_MIGRATION.sql` in Production Database
- **Location:** https://zujqziqteggihirewuxf.supabase.co → SQL Editor
- **Impact:** Collections feature won't work until migration runs

#### 2. **Combobox Component Stability** - ⚠️ **MEDIUM**
- **Location:** `src/components/ui/combobox.tsx`
- **Issue:** Interactivity issues with search input
- **Current Workaround:** Using standard Shadcn `Select` component instead
- **Status:** Combobox exists but not actively used in UI
- **Files affected:**
  - `src/components/ui/select.tsx` (active)
  - `src/components/ui/combobox.tsx` (inactive)
  - `src/components/ui/popover.tsx`
  - `src/components/ui/command.tsx`

#### 3. **Email Sending Implementation** - ⚠️ **LOW**
- **Location:** `src/inngest/functions/generate-emails.ts:203`
- **Issue:** TODO comment indicates email sending logic needs implementation
- **Current:** AI generates emails but doesn't send them
- **Status:** Feature exists but not fully implemented

#### 4. **BigInt Serialization** - ✅ **RESOLVED**
- **Issue:** React Client Components couldn't handle PostgreSQL BigInt types
- **Solution:** Explicit `.toString()` conversion in server components before passing to client
- **Files:**
  - `src/app/(dashboard)/collections/[id]/page.tsx` (lines 83-86)
  - `src/components/collections/CollectionItemsTable.tsx` (defensive rendering)

#### 5. **Dual Database Complexity** - ℹ️ **ARCHITECTURAL**
- **Issue:** Campaigns live in User DB, while Collections/Leads live in Production DB.
- **Impact:** Cannot create Foreign Key constraints between Campaigns and Collections. Requires maintaining two separate database connections (`supabase.ts` vs `company-client.ts`).
- **Recommendation:** Future developers should consider migrating Campaign tables to the Production Database to achieve a true Single-Database architecture.

### 🔄 Recent Changes (Latest Commit)

1. **Collections Migration Complete**
   - Migrated from hybrid DB to single Production DB
   - Fixed BigInt serialization issues
   - Added SQL migration script
   - Updated all API routes & components

2. **UI Component Updates**
   - Added Popover, Command, Combobox components
   - Updated Select component for collection selection
   - Fixed CollectionItemsTable with defensive rendering

---

## 📚 Database Schema

### Key Tables

#### Collections (Recently Migrated)
```sql
collections (
  id: serial PRIMARY KEY,
  user_id: varchar NOT NULL,
  name: varchar(255) NOT NULL,
  created_at: timestamp,
  updated_at: timestamp
)

collection_items (
  id: serial PRIMARY KEY,
  collection_id: integer FK → collections(id),
  business_id: integer FK → rawdata_yellowpage_new(listing_id),
  added_at: timestamp,
  UNIQUE(collection_id, business_id)
)
```

#### Business Data (Production DB)
```sql
rawdata_yellowpage_new (
  listing_id: serial PRIMARY KEY,  -- BigInt in DB
  company_name: varchar,
  email: varchar,
  phone_number: varchar,
  address_suburb: varchar,
  category_name: varchar,
  description_short: text,
  website_url: varchar,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### Campaigns (User DB)
```sql
campaigns (
  id: serial PRIMARY KEY,
  organization_id: varchar NOT NULL,  -- Tenant isolation
  name: varchar NOT NULL,
  subject: varchar NOT NULL,
  sender_name: varchar NOT NULL,
  sender_email: varchar NOT NULL,
  service_description: text NOT NULL,
  tone: varchar DEFAULT 'professional',
  status: varchar DEFAULT 'draft',
  total_recipients: integer DEFAULT 0,
  target_list_id: integer FK → target_lists(id),
  created_at: timestamp,
  updated_at: timestamp
)
```

---

## 🔐 Security & Permissions

### Database Access
- **User Database:** Full read/write with service role
- **Production Database:** Read-only access for lead data
- **Collections:** Recently migrated to Production DB with FK to rawdata_yellowpage_new

### Authentication
- **Primary:** Clerk for user auth
- **Secondary:** Supabase for service-level operations
- **Tenant Isolation:** All user data scoped by `organization_id`

### Environment Security
- All sensitive keys in `.env.local` (not committed)
- Service role keys have full DB access (⚠️ **Handle with care**)
- API keys for external services (OpenAI, Resend, Inngest)

---

## 📊 API Endpoints

### Collections ✅
- `GET /api/collections` - List user's collections
- `POST /api/collections` - Create collection
- `DELETE /api/collections/[id]` - Delete collection
- `GET /api/collections/[id]/items` - Get collection items with JOIN
- `POST /api/collections/[id]/items` - Add items to collection
- `DELETE /api/collections/[id]/items/[itemId]` - Remove item from collection

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PATCH /api/campaigns/[id]` - Update campaign
- `POST /api/campaigns/[id]/start` - Start campaign
- `GET /api/campaigns/[id]/items` - Get campaign recipients
- `POST /api/campaigns/[id]/send` - Send campaign

### Analytics
- `GET /api/analytics` - Overall analytics
- `GET /api/analytics/campaigns/[id]` - Campaign-specific analytics

### Webhooks
- `POST /api/webhooks/email-events` - Email service event tracking

---

## 🧪 Testing

### Manual Testing Checklist

1. **Leads Page**
   - [ ] Load leads with AG Grid
   - [ ] Apply filters (industry, location)
   - [ ] Search functionality
   - [ ] Select leads for collection

2. **Collections** (⚠️ Requires migration execution)
   - [ ] Create new collection
   - [ ] Add leads to collection
   - [ ] View collection details
   - [ ] Remove leads from collection
   - [ ] Delete collection

3. **Campaigns**
   - [ ] Create campaign from collection
   - [ ] Configure AI tone & subject
   - [ ] Generate email content
   - [ ] Send campaign
   - [ ] Track analytics

### Testing Commands
```bash
# Run development server
npm run dev

# Build production
npm run build

# Lint code
npm run lint

# Run migrations
npm run db:migrate
```

---

## 🚀 Deployment

**Platform:** Vercel

**URL:** https://aiemailplatform-4ayyppczc-hongbing-xiangs-projects.vercel.app

**Branch:** `1-b2b-email-marketing`

**Deployment Process:**
1. Code pushed to `1-b2b-email-marketing` branch
2. Vercel auto-deploys on push
3. Environment variables configured in Vercel dashboard
4. Build logs available in Vercel console

**Build Status:** ✅ All builds successful

---

## 📝 Next Steps for New Developer

### Immediate Tasks (High Priority)

1. **⚠️ Execute Collections Migration**
   ```bash
   # Go to: https://zujqziqteggihirewuxf.supabase.co
   # Navigate to: SQL Editor → New Query
   # Copy & run: PRODUCTION_DB_COLLECTIONS_MIGRATION.sql
   ```
   - This is **CRITICAL** - Collections feature won't work without it

2. **Environment Setup**
   - Copy `.env.local.template` to `.env.local`
   - Fill in all API keys (Clerk, Supabase, OpenAI, Resend, Inngest)
   - Request access to both Supabase databases

3. **Verify Functionality**
   - Test lead browsing
   - Test collection creation (after migration)
   - Test campaign creation

### Short-term Improvements (Medium Priority)

4. **Fix Combobox Component**
   - Debug interactivity issues in `combobox.tsx`
   - Replace Select with Combobox for better UX
   - Add searchable collection selection

5. **Implement Email Sending**
   - Complete TODO in `generate-emails.ts:203`
   - Integrate with Resend API
   - Test end-to-end campaign delivery

6. **Testing**
   - Add unit tests for server actions
   - Add integration tests for API routes
   - Add E2E tests for user flows

### Long-term Enhancements (Low Priority)

7. **Performance Optimization**
   - Implement caching for lead queries
   - Add pagination to large datasets
   - Optimize AG Grid rendering

8. **Feature Additions**
   - Email templates library
   - A/B testing for campaigns
   - Advanced analytics dashboard
   - Lead enrichment APIs

9. **Code Quality**
   - Add comprehensive error handling
   - Improve TypeScript coverage
   - Add API rate limiting
   - Implement request validation (Zod)

---

## 🔗 Resources & Documentation

### Internal Documentation
- `COLLECTIONS_MIGRATION_COMPLETE.md` - Collections feature guide
- `COLLECTIONS_TABLE_FIX.md` - BigInt serialization fix
- `LEADS_PAGE_IMPLEMENTATION.md` - Leads feature details
- `COMPANY_DATA_IMPORT.md` - Production DB data guide

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Supabase Docs](https://supabase.com/docs)
- [Clerk Auth](https://clerk.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [AG Grid](https://www.ag-grid.com/react-data-grid/)
- [Inngest](https://www.inngest.com/docs)

### Database Access
- **User DB:** https://supabase.com/dashboard/project/ctdrapmcjefjqhhdyalg
- **Production DB:** https://supabase.com/dashboard/project/zujqziqteggihirewuxf

---

## 📞 Contact & Support

**Previous Developer:** (Intern who created this handover)

**Code Repository:** `au-email-marketing-saas`

**Current Branch:** `1-b2b-email-marketing`

**Production URL:** https://aiemailplatform-4ayyppczc-hongbing-xiangs-projects.vercel.app

---

## 📄 Additional Notes

### Database Connection Pattern

The application uses **dual database access patterns**:

```typescript
// For User Data (campaigns, quotas, etc.)
import { getSupabaseAdmin } from '@/lib/db/supabase';
const supabase = getSupabaseAdmin();

// For Business Data (leads, collections - recently migrated)
import { getCompanyDbClient } from '@/lib/db/company-client';
const supabase = getCompanyDbClient();
```

### BigInt Handling

PostgreSQL BigInt types require explicit conversion:

```typescript
// ❌ Wrong - BigInt can't be serialized to JSON
const id = row.listing_id;  // BigInt

// ✅ Correct - Convert to string for React
const id = row.listing_id?.toString();  // string
```

This is handled in:
- `src/app/(dashboard)/collections/[id]/page.tsx` (lines 84-86)
- All API routes returning BigInt values

### AG Grid Usage

The application uses AG Grid for high-performance tables:

```typescript
// Import modules
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

// Use in component
<AgGridReact
  rowData={items}
  columnDefs={columnDefs}
  defaultColDef={defaultColDef}
  onGridReady={onGridReady}
  onSelectionChanged={onSelectionChanged}
/>
```

### Server Actions Pattern

Collection operations use Server Actions:

```typescript
// In page component
import { createCollection } from '@/lib/actions/collections';

// Use in form
await createCollection({ name, userId });
```

---

**Last Updated:** January 15, 2026

**Document Version:** 1.0

---

*This document was created as part of project handover. For questions or clarifications, please refer to the codebase or contact the previous developer.*
