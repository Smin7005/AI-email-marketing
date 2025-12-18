<!--
Sync Impact Report:
- Version change: N/A → 1.0.0 (Initial creation)
- Added sections: Core Principles (I-VII), Architecture & Performance, Security & Data, V1 Scope, Governance
- Templates requiring updates: plan-template.md (Constitution Check section), spec-template.md (no changes needed), tasks-template.md (no changes needed)
- Follow-up TODOs: None
-->

# AI Email Marketing SaaS (AU B2B) Constitution

## Core Principles

### I. Tech Stack Mandate
All development MUST use the specified stack: Next.js 14+ (App Router), TypeScript, Supabase (Postgres), Drizzle ORM, Clerk (Organizations for multi-tenancy), Inngest (async workflows), AWS SES or Resend (email), and OpenAI gpt-4o-mini (AI generation).

**Rationale**: Ensures consistency across the codebase and leverages proven technologies for rapid development.

### II. Async-First Architecture
All batch operations, especially AI generation and email sending, MUST use Inngest queues/steps. Never process more than 3 items synchronously in API routes.

**Rationale**: Prevents API timeouts, enables horizontal scaling, and provides better user experience for long-running operations.

### III. Schema-First Development
The Drizzle schema is the single source of truth. All database changes must be implemented through schema modifications first, then migrated.

**Rationale**: Ensures database consistency, enables type safety, and provides clear version control for schema changes.

### IV. Tenant Isolation
All database queries accessing user data (campaigns, lists) MUST be filtered by `organization_id`. No exceptions.

**Rationale**: Critical for multi-tenant security, preventing data leakage between organizations.

### V. Unsubscribe Compliance
Every email must contain a signed unsubscribe link handled by a tenant-scoped suppression list. Compliance is non-negotiable.

**Rationale**: Legal requirement for email marketing, protects against spam complaints, maintains sender reputation.

### VI. V1 Scope Focus
Development must prioritize Campaign creation, Business Database filtering (City/Industry), and Reporting (Sent/Open/Click). No feature creep beyond these core areas.

**Rationale**: Ensures rapid delivery of MVP with clear value proposition for Australian B2B market.

### VII. Type Safety
All code must be written in TypeScript with strict mode enabled. No `any` types allowed without explicit justification.

**Rationale**: Reduces runtime errors, improves developer experience, and enables better refactoring capabilities.

## Architecture & Performance Standards

### API Design
- RESTful endpoints with clear resource naming
- Consistent error handling with structured responses
- Rate limiting per organization
- Request/response validation using Zod schemas

### Database Performance
- Indexed queries for all filtered fields
- Connection pooling configured
- Query result limits enforced
- N+1 query prevention mandatory

### Caching Strategy
- Redis for session management
- CDN for static assets
- Query result caching for reports
- Cache invalidation on data updates

## Security & Data Protection

### Authentication & Authorization
- Clerk handles all authentication
- Role-based permissions within organizations
- API keys scoped to organization
- JWT tokens with short expiration

### Data Encryption
- All data encrypted at rest in Supabase
- TLS 1.3 for all network communications
- API keys encrypted before storage
- PII data access logging

### Compliance Requirements
- GDPR compliance for EU users
- Australian Privacy Act compliance
- CAN-SPAM Act compliance for emails
- Data retention policies enforced

## Development Workflow

### Code Review Process
- All changes require PR review
- Constitution compliance check required
- TypeScript compilation must pass
- All tests must pass before merge

### Testing Requirements
- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Performance tests for bulk operations

### Deployment Standards
- Blue-green deployments
- Database migrations must be backward compatible
- Feature flags for new functionality
- Rollback procedures documented

## Governance

This constitution supersedes all other development practices. Any deviations must be documented with clear justification and approved by technical leadership.

### Amendment Process
1. Proposed changes must be documented
2. Impact analysis on existing code required
3. Team review and discussion mandatory
4. Approval requires unanimous consent from senior developers

### Compliance Review
- Monthly constitution compliance audits
- New features must include compliance checklist
- Technical debt items tracked for constitution violations
- Developer onboarding includes constitution training

### Version Management
Constitution version follows semantic versioning:
- MAJOR: Breaking changes to core principles
- MINOR: New principles or significant clarifications
- PATCH: Typos, minor clarifications, formatting

**Version**: 1.0.0 | **Ratified**: 2025-12-05 | **Last Amended**: 2025-12-05