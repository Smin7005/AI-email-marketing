import { db } from '../db';
import { organization_quotas, emailEvents } from '../db/schema';
import { eq, count, and, sql, gte } from 'drizzle-orm';
import { withOrganization } from '../db/tenant';

export interface QuotaInfo {
  monthlyQuota: number;
  emailsSentThisMonth: number;
  emailsRemaining: number;
  quotaPercentage: number;
  quotaResetDate: Date;
  isOverQuota: boolean;
  warningThreshold: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  quotaInfo: QuotaInfo;
  requestedCount: number;
  canSend: number;
}

export class QuotaService {
  private readonly DEFAULT_MONTHLY_QUOTA = 1000;
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly QUOTA_RESET_DAY = 1; // 1st of each month

  /**
   * Get quota information for an organization
   * @param organizationId Organization ID
   * @returns Quota information
   */
  async getQuotaInfo(organizationId: string): Promise<QuotaInfo> {
    // Get or create quota record
    let quota = await db
      .select()
      .from(organization_quotas)
      .where(withOrganization(organizationId))
      .limit(1);

    if (!quota[0]) {
      // Create default quota
      [quota[0]] = await db
        .insert(organization_quotas)
        .values({
          organizationId,
          monthlyQuota: this.DEFAULT_MONTHLY_QUOTA,
          emailsSentThisMonth: 0,
          quotaResetDate: this.getNextResetDate(),
        })
        .returning();
    }

    // Check if we need to reset the monthly counter
    const now = new Date();
    const resetDate = new Date(quota[0].quotaResetDate);

    if (now >= resetDate) {
      // Reset the counter
      [quota[0]] = await db
        .update(organization_quotas)
        .set({
          emailsSentThisMonth: 0,
          quotaResetDate: this.getNextResetDate(),
        })
        .where(eq(organization_quotas.id, quota[0].id))
        .returning();
    }

    const monthlyQuota = quota[0].monthlyQuota;
    const emailsSentThisMonth = quota[0].emailsSentThisMonth;
    const emailsRemaining = Math.max(0, monthlyQuota - emailsSentThisMonth);
    const quotaPercentage = monthlyQuota > 0 ? (emailsSentThisMonth / monthlyQuota) : 0;

    return {
      monthlyQuota,
      emailsSentThisMonth,
      emailsRemaining,
      quotaPercentage,
      quotaResetDate: new Date(quota[0].quotaResetDate),
      isOverQuota: emailsSentThisMonth >= monthlyQuota,
      warningThreshold: this.WARNING_THRESHOLD,
    };
  }

  /**
   * Check if organization can send emails
   * @param organizationId Organization ID
   * @param requestedCount Number of emails to send
   * @returns Quota check result
   */
  async checkQuota(organizationId: string, requestedCount: number): Promise<QuotaCheckResult> {
    const quotaInfo = await this.getQuotaInfo(organizationId);

    if (quotaInfo.isOverQuota) {
      return {
        allowed: false,
        reason: 'Monthly quota exceeded',
        quotaInfo,
        requestedCount,
        canSend: 0,
      };
    }

    const canSend = Math.min(requestedCount, quotaInfo.emailsRemaining);

    if (canSend < requestedCount) {
      return {
        allowed: false,
        reason: `Only ${canSend} emails remaining out of ${requestedCount} requested`,
        quotaInfo,
        requestedCount,
        canSend,
      };
    }

    return {
      allowed: true,
      quotaInfo,
      requestedCount,
      canSend,
    };
  }

  /**
   * Increment email count for organization
   * @param organizationId Organization ID
   * @param count Number of emails sent
   */
  async incrementEmailCount(organizationId: string, count: number) {
    const quota = await db
      .select()
      .from(organization_quotas)
      .where(withOrganization(organizationId))
      .limit(1);

    if (!quota[0]) {
      throw new Error('Quota record not found');
    }

    await db
      .update(organization_quotas)
      .set({
        emailsSentThisMonth: sql`${organization_quotas.emailsSentThisMonth} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(organization_quotas.id, quota[0].id));
  }

  /**
   * Update monthly quota for organization
   * @param organizationId Organization ID
   * @param newQuota New monthly quota
   */
  async updateMonthlyQuota(organizationId: string, newQuota: number) {
    await db
      .update(organization_quotas)
      .set({
        monthlyQuota: newQuota,
        updatedAt: new Date(),
      })
      .where(withOrganization(organizationId));
  }

  /**
   * Get organizations approaching quota limit
   * @param threshold Percentage threshold (default: 80%)
   * @returns Array of organizations near quota
   */
  async getOrganizationsNearQuota(threshold = this.WARNING_THRESHOLD) {
    const now = new Date();

    const results = await db
      .select({
        organizationId: organization_quotas.organizationId,
        monthlyQuota: organization_quotas.monthlyQuota,
        emailsSentThisMonth: organization_quotas.emailsSentThisMonth,
        quotaPercentage: sql<number>`(
          ${organization_quotas.emailsSentThisMonth}::float /
          NULLIF(${organization_quotas.monthlyQuota}, 0)::float
        ) * 100`,
      })
      .from(organization_quotas)
      .where(
        and(
          sql`${organization_quotas.quotaResetDate} > ${now}`,
          sql`(
            ${organization_quotas.emailsSentThisMonth}::float /
            NULLIF(${organization_quotas.monthlyQuota}, 0)::float
          ) >= ${threshold}`
        )
      )
      .orderBy(desc(sql`(
        ${organization_quotas.emailsSentThisMonth}::float /
        NULLIF(${organization_quotas.monthlyQuota}, 0)::float
      )`));

    return results;
  }

  /**
   * Check if organization should receive quota warning
   * @param organizationId Organization ID
   * @returns true if warning should be sent
   */
  async shouldSendQuotaWarning(organizationId: string): Promise<boolean> {
    const quotaInfo = await this.getQuotaInfo(organizationId);

    // Only warn once when crossing threshold
    if (quotaInfo.quotaPercentage >= this.WARNING_THRESHOLD && !quotaInfo.isOverQuota) {
      // Check if we've already warned this month
      const quota = await db
        .select({
          lastWarningSent: organization_quotas.lastWarningSent,
        })
        .from(organization_quotas)
        .where(withOrganization(organizationId))
        .limit(1);

      const lastWarning = quota[0]?.lastWarningSent;
      const now = new Date();

      // Don't warn more than once per month
      if (!lastWarning || new Date(lastWarning).getMonth() !== now.getMonth()) {
        // Update last warning sent
        await db
          .update(organization_quotas)
          .set({
            lastWarningSent: now,
          })
          .where(withOrganization(organizationId));

        return true;
      }
    }

    return false;
  }

  /**
   * Reset monthly quota for all organizations
   * Called by a scheduled job on the 1st of each month
   */
  async resetMonthlyQuotas() {
    const now = new Date();
    const nextResetDate = this.getNextResetDate();

    await db
      .update(organization_quotas)
      .set({
        emailsSentThisMonth: 0,
        quotaResetDate: nextResetDate,
        lastWarningSent: null,
        updatedAt: now,
      })
      .where(sql`${organization_quotas.quotaResetDate} <= ${now}`);
  }

  /**
   * Get the next quota reset date
   * @returns Next reset date
   */
  private getNextResetDate(): Date {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    return new Date(nextYear, nextMonth, this.QUOTA_RESET_DAY);
  }
}

export const quotaService = new QuotaService();