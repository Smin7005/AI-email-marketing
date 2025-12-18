import { db } from '../db';
import { suppressionList } from '../db/schema';
import { and, eq, inArray, sql, desc } from 'drizzle-orm';
import { withOrganization } from '../db/tenant';

export type SuppressionType = 'unsubscribed' | 'bounced' | 'complained';

export interface SuppressionData {
  email: string;
  type: SuppressionType;
  reason?: string;
  campaignId?: number;
}

export interface SuppressionRecord {
  id: number;
  organizationId: string;
  email: string;
  type: SuppressionType;
  reason?: string;
  campaignId?: number;
  createdAt: Date;
}

export class SuppressionService {
  /**
   * Check if email is suppressed
   * @param organizationId Organization ID
   * @param email Email address to check
   * @returns true if suppressed
   */
  async isSuppressed(organizationId: string, email: string): Promise<boolean> {
    const result = await db
      .select({ id: suppressionList.id })
      .from(suppressionList)
      .where(
        and(
          withOrganization(organizationId),
          eq(suppressionList.email, email.toLowerCase())
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Check if multiple emails are suppressed
   * @param organizationId Organization ID
   * @param emails Array of email addresses
   * @returns Set of suppressed emails
   */
  async getSuppressedEmails(organizationId: string, emails: string[]): Promise<Set<string>> {
    if (emails.length === 0) {
      return new Set();
    }

    const result = await db
      .select({ email: suppressionList.email })
      .from(suppressionList)
      .where(
        and(
          withOrganization(organizationId),
          inArray(suppressionList.email, emails.map(e => e.toLowerCase()))
        )
      );

    return new Set(result.map(r => r.email));
  }

  /**
   * Add email to suppression list
   * @param organizationId Organization ID
   * @param data Suppression data
   * @returns Created suppression record
   */
  async addToSuppressionList(
    organizationId: string,
    data: SuppressionData
  ): Promise<SuppressionRecord> {
    const [record] = await db
      .insert(suppressionList)
      .values({
        organizationId,
        email: data.email.toLowerCase(),
        type: data.type,
        reason: data.reason,
        campaignId: data.campaignId,
      })
      .onConflictDoNothing() // Don't error if already suppressed
      .returning();

    if (!record) {
      // Check if record already exists
      const existing = await db
        .select()
        .from(suppressionList)
        .where(
          and(
            withOrganization(organizationId),
            eq(suppressionList.email, data.email.toLowerCase())
          )
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error('Failed to add to suppression list');
      }

      return existing[0] as SuppressionRecord;
    }

    return record as SuppressionRecord;
  }

  /**
   * Remove email from suppression list (admin only)
   * @param organizationId Organization ID
   * @param email Email address to remove
   */
  async removeFromSuppressionList(organizationId: string, email: string): Promise<void> {
    await db
      .delete(suppressionList)
      .where(
        and(
          withOrganization(organizationId),
          eq(suppressionList.email, email.toLowerCase())
        )
      );
  }

  /**
   * Get suppression list for organization
   * @param organizationId Organization ID
   * @param page Page number
   * @param limit Items per page
   * @param type Optional filter by suppression type
   * @returns Paginated suppression records
   */
  async getSuppressionList(
    organizationId: string,
    page = 1,
    limit = 50,
    type?: SuppressionType
  ): Promise<{
    records: SuppressionRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const conditions = [withOrganization(organizationId)];
    if (type) {
      conditions.push(eq(suppressionList.type, type));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [records, totalResult] = await Promise.all([
      db
        .select()
        .from(suppressionList)
        .where(whereClause)
        .orderBy(desc(suppressionList.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(suppressionList)
        .where(whereClause),
    ]);

    return {
      records: records as SuppressionRecord[],
      total: totalResult[0].count,
      page,
      limit,
      totalPages: Math.ceil(totalResult[0].count / limit),
    };
  }

  /**
   * Get suppression statistics
   * @param organizationId Organization ID
   * @returns Suppression statistics
   */
  async getSuppressionStats(organizationId: string): Promise<{
    total: number;
    byType: Record<SuppressionType, number>;
    recent: number; // Last 30 days
  }> {
    // Total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppressionList)
      .where(withOrganization(organizationId));

    // Count by type
    const typeCounts = await db
      .select({
        type: suppressionList.type,
        count: sql<number>`count(*)`,
      })
      .from(suppressionList)
      .where(withOrganization(organizationId))
      .groupBy(suppressionList.type);

    const byType: Record<SuppressionType, number> = {
      unsubscribed: 0,
      bounced: 0,
      complained: 0,
    };

    typeCounts.forEach(item => {
      byType[item.type as SuppressionType] = item.count;
    });

    // Recent count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppressionList)
      .where(
        and(
          withOrganization(organizationId),
          sql`${suppressionList.createdAt} >= ${thirtyDaysAgo}`
        )
      );

    return {
      total: totalResult[0].count,
      byType,
      recent: recentResult[0].count,
    };
  }

  /**
   * Bulk suppress emails (for bounced/complained events)
   * @param organizationId Organization ID
   * @param emails Array of emails to suppress
   * @param type Suppression type
   * @param reason Optional reason
   * @param campaignId Optional campaign ID
   */
  async bulkSuppress(
    organizationId: string,
    emails: string[],
    type: SuppressionType,
    reason?: string,
    campaignId?: number
  ): Promise<number> {
    if (emails.length === 0) {
      return 0;
    }

    const values = emails.map(email => ({
      organizationId,
      email: email.toLowerCase(),
      type,
      reason,
      campaignId,
    }));

    const result = await db
      .insert(suppressionList)
      .values(values)
      .onConflictDoNothing();

    // Return number of rows affected
    return 1;
  }

  /**
   * Export suppression list
   * @param organizationId Organization ID
   * @param format Export format ('csv' | 'json')
   * @returns Export data
   */
  async exportSuppressionList(
    organizationId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const records = await db
      .select({
        email: suppressionList.email,
        type: suppressionList.type,
        reason: suppressionList.reason,
        campaignId: suppressionList.campaignId,
        createdAt: suppressionList.createdAt,
      })
      .from(suppressionList)
      .where(withOrganization(organizationId))
      .orderBy(desc(suppressionList.createdAt));

    if (format === 'json') {
      return JSON.stringify(records, null, 2);
    }

    // CSV format
    const headers = ['Email', 'Type', 'Reason', 'Campaign ID', 'Created At'];
    const rows = records.map(r => [
      r.email,
      r.type,
      r.reason || '',
      r.campaignId?.toString() || '',
      r.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}

export const suppressionService = new SuppressionService();