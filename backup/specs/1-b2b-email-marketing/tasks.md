# Tasks: B2B Email Marketing SaaS for Australian Local Service Providers

**Input**: Design documents from `/specs/1-b2b-email-marketing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 0: Infrastructure & Scaffolding

**Purpose**: Project initialization and basic infrastructure setup

- [ ] T001 Create Next.js 14+ project with TypeScript and App Router in `src/`
- [ ] T002 [P] Configure TypeScript strict mode in `tsconfig.json`
- [ ] T003 Install and configure Tailwind CSS for styling in `src/app/globals.css`
- [ ] T004 [P] Set up project structure per plan.md (create `src/app/`, `src/components/`, `src/lib/` directories)
- [ ] T005 Create `.env.local` template with all required environment variables
- [ ] T006 Install Drizzle ORM and configure database connection in `src/lib/db/index.ts`
- [ ] T007 Install and configure Supabase client in `src/lib/db/supabase.ts`
- [ ] T008 Install Clerk and configure authentication in `src/middleware.ts`
- [ ] T009 Create authentication layout in `src/app/(auth)/layout.tsx`
- [ ] T010 [P] Set up Clerk sign-in page in `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- [ ] T011 [P] Set up Clerk sign-up page in `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- [ ] T012 Install Inngest SDK and create client in `src/lib/inngest/client.ts`
- [ ] T013 Create Inngest serve endpoint in `src/app/api/inngest/route.ts`
- [ ] T014 Install AWS SES SDK and configure in `src/lib/email/aws-ses.ts`
- [ ] T015 Install OpenAI SDK and configure in `src/lib/ai/openai.ts`
- [ ] T016 Create base error handling utility in `src/lib/utils/errors.ts`
- [ ] T017 Set up logging utility in `src/lib/utils/logger.ts`
- [ ] T018 Configure ESLint and Prettier in `.eslintrc.json` and `.prettierrc`

**Verification**: Run `npm run dev` and verify Next.js starts without errors. Check that all dependencies are installed correctly.

---

## Phase 1: Database & Models

**Purpose**: Database schema, migrations, and seed data setup

### Phase 1.1: Drizzle Schema & Migrations

- [ ] T019 Create Drizzle schema file `src/lib/db/schema.ts` with all 5 tables (businesses, campaigns, campaign_items, email_events, suppression_list)
- [ ] T020 [P] Add database indexes for performance in `src/lib/db/schema.ts`
- [ ] T021 Create Drizzle config file `drizzle.config.ts`
- [ ] T022 Create migration script `src/lib/db/migrate.ts`
- [ ] T023 Run initial migration: `npm run db:generate` and `npm run db:push`
- [ ] T024 Create database types file `src/lib/db/types.ts` from schema

**Verification**: Verify tables are created in Supabase dashboard. Run `npm run db:studio` to inspect schema.

### Phase 1.2: Seed Data for Australian Businesses

- [ ] T025 Create seed data script `src/lib/db/seed/businesses.ts` with 100+ Australian businesses
- [ ] T026 [P] Create sample data for major cities (Sydney, Melbourne, Brisbane, Perth, Adelaide)
- [ ] T027 [P] Create sample data for key industries (IT Services, Cleaning, Marketing, etc.)
- [ ] T028 Create seed runner script `src/lib/db/seed/index.ts`
- [ ] T029 Run seed script: `npm run db:seed`
- [ ] T030 Create seed verification query in `src/lib/db/verify-seed.ts`

**Verification**: Run `SELECT COUNT(*) FROM businesses` in Supabase and verify 100+ records exist. Check that cities and industries are properly distributed.

### Phase 1.3: Database Utilities

- [ ] T031 Create database connection pool manager in `src/lib/db/pool.ts`
- [ ] T032 Create base repository pattern in `src/lib/db/repository.ts`
- [ ] T033 Create organization-scoped query helper in `src/lib/db/tenant.ts`
- [ ] T034 Create database transaction helper in `src/lib/db/transaction.ts`

**Verification**: Test database connection with a simple query. Verify tenant isolation works correctly.

---

## Phase 2: Core Backend Logic

**Purpose**: Foundational backend infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Phase 2.1: Authentication & Authorization

- [ ] T035 Create auth context provider in `src/lib/auth/context.tsx`
- [ ] T036 Create organization hook in `src/lib/auth/use-organization.ts`
- [ ] T037 Create protected route wrapper in `src/lib/auth/protected.tsx`
- [ ] T038 Create API route authentication helper in `src/lib/auth/api.ts`
- [ ] T039 Add organization context to all API routes in `src/app/api/route.ts`

**Verification**: Test that only authenticated users can access protected routes. Verify organization_id is available in all contexts.

### Phase 2.2: Core Services

- [ ] T040 Create business service in `src/lib/services/business.ts` with search functionality
- [ ] T041 Create campaign service in `src/lib/services/campaign.ts` with CRUD operations
- [ ] T042 Create email service in `src/lib/services/email.ts` for sending
- [ ] T043 Create analytics service in `src/lib/services/analytics.ts` for metrics
- [ ] T044 Create quota service in `src/lib/services/quota.ts` for usage tracking
- [ ] T045 Create suppression service in `src/lib/services/suppression.ts` for unsubscribe management

**Verification**: Test each service with unit tests. Verify all services respect tenant isolation.

### Phase 2.3: Inngest Functions

- [ ] T046 Create Inngest function `batchGenerateEmails` in `src/lib/inngest/functions/batch-generate-emails.ts`
- [ ] T047 Create Inngest function `sendCampaignBatch` in `src/lib/inngest/functions/send-campaign-batch.ts`
- [ ] T048 Create email generation helper in `src/lib/inngest/helpers/generate-email.ts`
- [ ] T049 Create email sending helper in `src/lib/inngest/helpers/send-email.ts`
- [ ] T050 Create suppression check helper in `src/lib/inngest/helpers/check-suppression.ts`
- [ ] T051 Register Inngest functions in `src/lib/inngest/functions/index.ts`

**Verification**: Deploy to Inngest and verify functions appear in Inngest Dashboard. Test function execution locally.

### Phase 2.4: Email Templates & Utilities

- [ ] T052 Create email template for unsubscribe footer in `src/lib/email/templates/unsubscribe.ts`
- [ ] T053 Create JWT token generator for unsubscribe links in `src/lib/auth/jwt.ts`
- [ ] T054 Create email validation utility in `src/lib/email/validate.ts`
- [ ] T055 Create rate limiting utility for email sending in `src/lib/email/rate-limit.ts`

**Verification**: Test JWT token generation and verification. Verify email validation catches invalid formats.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Find and Filter Business Leads (Priority: P1) 🎯 MVP

**Goal**: Enable users to search and filter Australian businesses by city and industry, creating targeted prospect lists

**Independent Test**: Search businesses by "Sydney" and "IT Services" and verify results show only IT businesses in Sydney

### Implementation for User Story 1

- [ ] T056 [P] [US1] Create BusinessSearchInput component in `src/components/businesses/BusinessSearchInput.tsx`
- [ ] T057 [P] [US1] Create BusinessList component in `src/components/businesses/BusinessList.tsx`
- [ ] T058 [US1] Create BusinessCard component in `src/components/businesses/BusinessCard.tsx`
- [ ] T059 [US1] Create business search page in `src/app/(dashboard)/businesses/page.tsx`
- [ ] T060 [US1] Implement GET /api/businesses endpoint in `src/app/api/businesses/route.ts`
- [ ] T061 [US1] Add city filter query parameter to business search
- [ ] T062 [US1] Add industry filter query parameter to business search
- [ ] T063 [US1] Add pagination to business search (50 results per page)
- [ ] T064 [US1] Create "Create Campaign from Results" button component
- [ ] T065 [US1] Implement campaign creation from selected businesses
- [ ] T066 [US1] Add loading states for business search
- [ ] T067 [US1] Add error handling for failed searches
- [ ] T068 [US1] Create empty state for no search results
- [ ] T069 [US1] Add business count display ("Found 234 businesses")

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Create AI-Generated Email Campaign (Priority: P1) 🎯 MVP

**Goal**: Enable AI to generate personalized emails for each prospect based on their business description

**Independent Test**: Create campaign with 10 prospects and verify each email is unique and personalized

### Implementation for User Story 2

- [ ] T070 [P] [US2] Create CampaignForm component in `src/components/campaigns/CampaignForm.tsx`
- [ ] T071 [P] [US2] Create CampaignPreview component in `src/components/campaigns/CampaignPreview.tsx`
- [ ] T072 [US2] Create EmailEditor component in `src/components/campaigns/EmailEditor.tsx`
- [ ] T073 [US2] Create campaign creation page in `src/app/(dashboard)/campaigns/create/page.tsx`
- [ ] T074 [US2] Implement POST /api/campaigns endpoint in `src/app/api/campaigns/route.ts`
- [ ] T075 [US2] Add campaign validation (name, subject, sender details)
- [ ] T076 [US2] Implement POST /api/campaigns/{id}/generate endpoint
- [ ] T077 [US2] Add campaign status tracking (draft → generating → ready)
- [ ] T078 [US2] Create progress indicator for AI generation
- [ ] T079 [US2] Add "Regenerate Email" functionality for individual emails
- [ ] T080 [US2] Implement email preview modal
- [ ] T081 [US2] Add tone selection (professional, friendly, casual)
- [ ] T082 [US2] Create service description input with character limit
- [ ] T083 [US2] Add generation queue status display
- [ ] T084 [US2] Implement error handling for failed generations

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Send Campaign and Track Metrics (Priority: P2)

**Goal**: Enable sending campaigns and tracking engagement metrics in real-time

**Independent Test**: Send a campaign and verify metrics update within 5 minutes

### Implementation for User Story 3

- [ ] T085 [P] [US3] Create CampaignSendButton component in `src/components/campaigns/CampaignSendButton.tsx`
- [ ] T086 [P] [US3] Create CampaignMetrics component in `src/components/campaigns/CampaignMetrics.tsx`
- [ ] T087 [P] [US3] Create MetricsChart component in `src/components/analytics/MetricsChart.tsx`
- [ ] T088 [US3] Create campaign detail page in `src/app/(dashboard)/campaigns/[id]/page.tsx`
- [ ] T089 [US3] Implement POST /api/campaigns/{id}/send endpoint
- [ ] T090 [US3] Add quota check before sending (prevent if over limit)
- [ ] T091 [US3] Implement sending confirmation dialog
- [ ] T092 [US3] Create real-time metrics update mechanism
- [ ] T093 [US3] Add delivery status for each email (pending, sent, failed)
- [ ] T094 [US3] Implement metrics: delivered, opened, clicked, bounced
- [ ] T095 [US3] Create campaign timeline view
- [ ] T096 [US3] Add export metrics functionality (CSV)
- [ ] T097 [US3] Create campaign status badges (draft, sending, sent)
- [ ] T098 [US3] Add sending progress indicator

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Manage Monthly Quota (Priority: P2)

**Goal**: Enable users to view quota usage and receive notifications when approaching limits

**Independent Test**: Send emails and verify quota counter updates correctly

### Implementation for User Story 4

- [ ] T099 [P] [US4] Create QuotaDisplay component in `src/components/quota/QuotaDisplay.tsx`
- [ ] T100 [P] [US4] Create QuotaProgressBar component in `src/components/quota/QuotaProgressBar.tsx`
- [ ] T101 [US4] Create quota notification banner in `src/components/quota/QuotaNotification.tsx`
- [ ] T102 [US4] Implement GET /api/quota endpoint in `src/app/api/quota/route.ts`
- [ ] T103 [US4] Add quota tracking to email sending logic
- [ ] T104 [US4] Implement 80% quota warning notification
- [ ] T105 [US4] Add quota reset date display
- [ ] T106 [US4] Create quota usage history chart
- [ ] T107 [US4] Add quota upgrade prompt when near limit
- [ ] T108 [US4] Implement quota exceeded error handling
- [ ] T109 [US4] Create quota settings page in dashboard

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Webhooks & Analytics

**Purpose**: Email event tracking and advanced analytics features

- [ ] T110 [P] Create webhook handler for AWS SES in `src/app/api/webhooks/ses/route.ts`
- [ ] T111 [P] Create webhook handler for Resend in `src/app/api/webhooks/resend/route.ts`
- [ ] T112 Implement webhook signature verification
- [ ] T113 Create email event processor in `src/lib/email/process-event.ts`
- [ ] T114 Add webhook event types (delivered, opened, clicked, bounced, complained)
- [ ] T115 Create unsubscribe handler in `src/app/api/unsubscribe/[token]/route.ts`
- [ ] T116 Implement unsubscribe token verification
- [ ] T117 Add suppression list management
- [ ] T118 Create bounce handling logic
- [ ] T119 Implement complaint handling
- [ ] T120 Create webhook retry mechanism for failed events

**Verification**: Send test emails and verify webhooks receive events. Check that analytics update correctly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T121 [P] Add comprehensive error boundaries in `src/components/ErrorBoundary.tsx`
- [ ] T122 [P] Implement loading skeletons for all data fetching components
- [ ] T123 Add toast notifications for user actions in `src/components/ui/Toast.tsx`
- [ ] T124 Create empty state illustrations for no data scenarios
- [ ] T125 Add keyboard shortcuts for power users
- [ ] T126 Implement responsive design for mobile devices
- [ ] T127 Add dark mode support
- [ ] T128 Create help tooltips and onboarding tours
- [ ] T129 Add data export functionality (PDF reports)
- [ ] T130 Implement search functionality across campaigns
- [ ] T131 Add sorting and filtering to all data tables
- [ ] T132 Create keyboard navigation for accessibility
- [ ] T133 Add unit tests for critical business logic
- [ ] T134 Add integration tests for API endpoints
- [ ] T135 Create E2E tests for core user flows
- [ ] T136 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0**: No dependencies - can start immediately
- **Phase 1**: Depends on Phase 0 completion - BLOCKS all user stories
- **Phase 2**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3+**: All depend on Phase 2 completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Phase 7**: Depends on Phase 6 completion
- **Phase 8**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 - Depends on US1 for business selection
- **User Story 3 (P2)**: Can start after Phase 2 - Depends on US2 for campaign creation
- **User Story 4 (P2)**: Can start after Phase 2 - No dependencies on other stories

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All UI components for a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Create BusinessSearchInput component in src/components/businesses/BusinessSearchInput.tsx"
Task: "Create BusinessList component in src/components/businesses/BusinessList.tsx"
Task: "Create BusinessCard component in src/components/businesses/BusinessCard.tsx"

# Launch all API endpoints for User Story 1 together:
Task: "Implement GET /api/businesses endpoint in src/app/api/businesses/route.ts"
Task: "Add city filter query parameter to business search"
Task: "Add industry filter query parameter to business search"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 0: Infrastructure & Scaffolding
2. Complete Phase 1: Database & Models
3. Complete Phase 2: Core Backend Logic
4. Complete Phase 3: User Story 1
5. **STOP and VALIDATE**: Test business search functionality
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Infrastructure + Database + Backend → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic search!)
3. Add User Story 2 → Test independently → Deploy/Demo (AI generation!)
4. Add User Story 3 → Test independently → Deploy/Demo (Full campaign flow!)
5. Add User Story 4 → Test independently → Deploy/Demo (Quota management!)
6. Add Webhooks & Analytics → Complete system

### Parallel Team Strategy

With multiple developers:

1. Team completes Infrastructure + Database + Backend together
2. Once backend is ready:
   - Developer A: User Story 1 (Business search)
   - Developer B: User Story 2 (AI generation)
   - Developer C: User Story 3 (Sending & Analytics)
   - Developer D: User Story 4 (Quota management)
3. Stories complete and integrate independently

---

## Notes

- All database queries must include organization_id filter for tenant isolation
- Email sending must respect monthly quota limits per organization
- AI generation uses gpt-4o-mini for cost-effectiveness with large batches
- AWS SES rate limits require batching (14 emails/second max)
- All emails include mandatory unsubscribe links per compliance requirements
- Each task is atomic and can be completed in one coding session
- Verification steps are included for critical functionality