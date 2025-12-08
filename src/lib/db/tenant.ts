import { SQL, sql } from 'drizzle-orm';

/**
 * Creates a WHERE clause that filters by organization_id for multi-tenant queries
 * @param organizationId The organization ID to filter by
 * @param tableName The table name to apply the filter to
 * @returns SQL condition for organization isolation
 */
export function withOrganization(
  organizationId: string,
  tableName: string = 'organization_id'
): SQL {
  return sql`${sql.identifier(tableName)} = ${organizationId}`;
}

/**
 * Adds organization ID filter to a query builder
 * @param query The existing query SQL
 * @param organizationId The organization ID to filter by
 * @param tableName The table name to apply the filter to
 * @returns Combined SQL condition
 */
export function addOrganizationFilter(
  query: SQL,
  organizationId: string,
  tableName: string = 'organization_id'
): SQL {
  return sql`${query} AND ${withOrganization(organizationId, tableName)}`;
}

/**
 * Helper to ensure organization context is present
 * @param organizationId The organization ID to validate
 */
export function validateOrganizationId(organizationId: string): void {
  if (!organizationId || organizationId.trim() === '') {
    throw new Error('Organization ID is required for multi-tenant queries');
  }
}

/**
 * Creates a base tenant-scoped query helper
 * Usage: db.select().from(table).where(isTenantScoped(organizationId))
 */
export function isTenantScoped(organizationId: string): SQL {
  validateOrganizationId(organizationId);
  return withOrganization(organizationId);
}