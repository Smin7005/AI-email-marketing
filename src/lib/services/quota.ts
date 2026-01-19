import { getCompanyDbClient } from '../db/supabase';

export interface QuotaInfo {
  monthlyQuota: number;
  monthlyUsed: number;
  emailsRemaining: number;
  quotaPercentage: number;
  monthlyReset: Date;
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
    const supabase = getCompanyDbClient();

    // Get quota record
    let { data: quota, error } = await supabase
      .from('organization_quotas')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !quota) {
      // Create default quota
      const nextResetDate = this.getNextResetDate();

      const { data: newQuota, error: createError } = await supabase
        .from('organization_quotas')
        .insert({
          organization_id: organizationId,
          monthly_quota: this.DEFAULT_MONTHLY_QUOTA,
          monthly_used: 0,
          monthly_reset: nextResetDate.toISOString(),
        })
        .select()
        .single();

      if (createError || !newQuota) {
        console.error('Failed to create quota record:', createError);
        // Return default values if we can't create
        return {
          monthlyQuota: this.DEFAULT_MONTHLY_QUOTA,
          monthlyUsed: 0,
          emailsRemaining: this.DEFAULT_MONTHLY_QUOTA,
          quotaPercentage: 0,
          monthlyReset: nextResetDate,
          isOverQuota: false,
          warningThreshold: this.WARNING_THRESHOLD,
        };
      }
      quota = newQuota;
    }

    // Check if we need to reset the monthly counter
    const now = new Date();
    const resetDate = new Date(quota.monthly_reset);

    if (now >= resetDate) {
      // Reset the counter
      const nextResetDate = this.getNextResetDate();

      const { data: updatedQuota } = await supabase
        .from('organization_quotas')
        .update({
          monthly_used: 0,
          monthly_reset: nextResetDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', quota.id)
        .select()
        .single();

      if (updatedQuota) {
        quota = updatedQuota;
      }
    }

    const monthlyQuota = quota.monthly_quota;
    const monthlyUsed = quota.monthly_used;
    const emailsRemaining = Math.max(0, monthlyQuota - monthlyUsed);
    const quotaPercentage = monthlyQuota > 0 ? (monthlyUsed / monthlyQuota) : 0;

    return {
      monthlyQuota,
      monthlyUsed,
      emailsRemaining,
      quotaPercentage,
      monthlyReset: new Date(quota.monthly_reset),
      isOverQuota: monthlyUsed >= monthlyQuota,
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
    const supabase = getCompanyDbClient();

    const { data: quota } = await supabase
      .from('organization_quotas')
      .select('id, monthly_used')
      .eq('organization_id', organizationId)
      .single();

    if (!quota) {
      throw new Error('Quota record not found');
    }

    await supabase
      .from('organization_quotas')
      .update({
        monthly_used: quota.monthly_used + count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quota.id);
  }

  /**
   * Update monthly quota for organization
   * @param organizationId Organization ID
   * @param newQuota New monthly quota
   */
  async updateMonthlyQuota(organizationId: string, newQuota: number) {
    const supabase = getCompanyDbClient();

    await supabase
      .from('organization_quotas')
      .update({
        monthly_quota: newQuota,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);
  }

  /**
   * Get organizations approaching quota limit
   * @param threshold Percentage threshold (default: 80%)
   * @returns Array of organizations near quota
   */
  async getOrganizationsNearQuota(threshold = this.WARNING_THRESHOLD) {
    const supabase = getCompanyDbClient();
    const now = new Date();

    const { data: results, error } = await supabase
      .from('organization_quotas')
      .select('organization_id, monthly_quota, monthly_used')
      .gt('monthly_reset', now.toISOString());

    if (error || !results) {
      console.error('Failed to get organizations near quota:', error);
      return [];
    }

    // Filter and calculate percentage in code
    return results
      .map(r => ({
        organizationId: r.organization_id,
        monthlyQuota: r.monthly_quota,
        monthlyUsed: r.monthly_used,
        quotaPercentage: r.monthly_quota > 0 ? (r.monthly_used / r.monthly_quota) * 100 : 0,
      }))
      .filter(r => r.quotaPercentage >= threshold * 100)
      .sort((a, b) => b.quotaPercentage - a.quotaPercentage);
  }

  /**
   * Check if organization should receive quota warning
   * @param organizationId Organization ID
   * @returns true if warning should be sent
   */
  async shouldSendQuotaWarning(organizationId: string): Promise<boolean> {
    const quotaInfo = await this.getQuotaInfo(organizationId);
    const supabase = getCompanyDbClient();

    // Only warn once when crossing threshold
    if (quotaInfo.quotaPercentage >= this.WARNING_THRESHOLD && !quotaInfo.isOverQuota) {
      // Check if we've already warned this month
      const { data: quota } = await supabase
        .from('organization_quotas')
        .select('updated_at')
        .eq('organization_id', organizationId)
        .single();

      const lastWarning = quota?.updated_at;
      const now = new Date();

      // Don't warn more than once per month
      if (!lastWarning || new Date(lastWarning).getMonth() !== now.getMonth()) {
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
    const supabase = getCompanyDbClient();
    const now = new Date();
    const nextResetDate = this.getNextResetDate();

    // Get all quotas that need resetting
    const { data: quotasToReset } = await supabase
      .from('organization_quotas')
      .select('id')
      .lte('monthly_reset', now.toISOString());

    if (quotasToReset && quotasToReset.length > 0) {
      const ids = quotasToReset.map(q => q.id);

      await supabase
        .from('organization_quotas')
        .update({
          monthly_used: 0,
          monthly_reset: nextResetDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .in('id', ids);
    }
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
