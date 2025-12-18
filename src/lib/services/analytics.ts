import { db } from '../db';
import { campaigns, campaignItems, emailEvents, organizationQuotas } from '../db/schema';
import { and, eq, count, sum, desc, asc, sql, between } from 'drizzle-orm';
import { withOrganization } from '../db/tenant';

export interface CampaignMetrics {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  suppressed: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface OrganizationMetrics {
  totalCampaigns: number;
  totalEmailsSent: number;
  totalEmailsDelivered: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  quotaUsage: number;
  quotaLimit: number;
  quotaRemaining: number;
  quotaPercentage: number;
}

export interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export class AnalyticsService {
  /**
   * Get campaign metrics
   * @param organizationId Organization ID
   * @param campaignId Campaign ID
   * @returns Campaign metrics
   */
  async getCampaignMetrics(organizationId: string, campaignId: number): Promise<CampaignMetrics> {
    // Get campaign item status counts
    const itemCounts = await db
      .select({
        status: campaignItems.status,
        count: count(),
      })
      .from(campaignItems)
      .innerJoin(campaigns, eq(campaigns.id, campaignItems.campaignId))
      .where(
        and(
          eq(campaignItems.campaignId, campaignId),
          withOrganization(organizationId)
        )
      )
      .groupBy(campaignItems.status);

    const itemMap = itemCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get email event counts
    const eventCounts = await db
      .select({
        eventType: emailEvents.eventType,
        count: count(),
      })
      .from(emailEvents)
      .where(
        and(
          eq(emailEvents.campaignId, campaignId),
          withOrganization(organizationId)
        )
      )
      .groupBy(emailEvents.eventType);

    const eventMap = eventCounts.reduce((acc, item) => {
      acc[item.eventType] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const total = itemMap['sent'] || 0;
    const delivered = eventMap['delivered'] || 0;
    const opened = eventMap['opened'] || 0;
    const clicked = eventMap['clicked'] || 0;
    const bounced = eventMap['bounced'] || 0;
    const complained = eventMap['complained'] || 0;

    return {
      total: itemMap['total'] || total,
      sent: total,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      suppressed: itemMap['suppressed'] || 0,
      failed: itemMap['failed'] || 0,
      openRate: total > 0 ? (opened / total) * 100 : 0,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
    };
  }

  /**
   * Get organization-level metrics
   * @param organizationId Organization ID
   * @returns Organization metrics
   */
  async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetrics> {
    // Get campaign counts
    const campaignCount = await db
      .select({ count: count() })
      .from(campaigns)
      .where(withOrganization(organizationId));

    // Get email event counts
    const emailStats = await db
      .select({
        eventType: emailEvents.eventType,
        count: count(),
      })
      .from(emailEvents)
      .where(withOrganization(organizationId))
      .groupBy(emailEvents.eventType);

    const eventMap = emailStats.reduce((acc, item) => {
      acc[item.eventType] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get quota information
    const quotaResult = await db
      .select()
      .from(organizationQuotas)
      .where(withOrganization(organizationId))
      .limit(1);

    const quota = quotaResult[0];
    const quotaLimit = quota?.monthlyQuota || 1000;
    const quotaUsage = quota?.monthlyUsed || 0;

    return {
      totalCampaigns: campaignCount[0].count,
      totalEmailsSent: eventMap['sent'] || 0,
      totalEmailsDelivered: eventMap['delivered'] || 0,
      totalEmailsOpened: eventMap['opened'] || 0,
      totalEmailsClicked: eventMap['clicked'] || 0,
      quotaUsage,
      quotaLimit,
      quotaRemaining: Math.max(0, quotaLimit - quotaUsage),
      quotaPercentage: quotaLimit > 0 ? (quotaUsage / quotaLimit) * 100 : 0,
    };
  }

  /**
   * Get time series data for a date range
   * @param organizationId Organization ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Time series data
   */
  async getTimeSeriesData(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    // Get daily aggregated data
    const results = await db
      .select({
        date: sql<string>`DATE(${emailEvents.occurredAt})`,
        eventType: emailEvents.eventType,
        count: count(),
      })
      .from(emailEvents)
      .where(
        and(
          withOrganization(organizationId),
          between(emailEvents.occurredAt, startDate, endDate)
        )
      )
      .groupBy(
        sql`DATE(${emailEvents.occurredAt})`,
        emailEvents.eventType
      )
      .orderBy(sql`DATE(${emailEvents.occurredAt})`);

    // Transform to time series format
    const dataMap = new Map<string, TimeSeriesData>();

    results.forEach((row) => {
      const date = row.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        });
      }

      const data = dataMap.get(date)!;
      const eventType = row.eventType;

      if (eventType === 'sent') data.sent = row.count;
      else if (eventType === 'delivered') data.delivered = row.count;
      else if (eventType === 'opened') data.opened = row.count;
      else if (eventType === 'clicked') data.clicked = row.count;
      else if (eventType === 'bounced') data.bounced = row.count;
    });

    return Array.from(dataMap.values());
  }

  /**
   * Get top performing campaigns
   * @param organizationId Organization ID
   * @param limit Number of campaigns to return
   * @returns Top campaigns by metrics
   */
  async getTopCampaigns(organizationId: string, limit = 10) {
    // This is a simplified version - in production you'd want to optimize this query
    const campaignsList = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        createdAt: campaigns.createdAt,
        totalRecipients: campaigns.totalRecipients,
      })
      .from(campaigns)
      .where(withOrganization(organizationId))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);

    // Get metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaignsList.map(async (campaign) => {
        const metrics = await this.getCampaignMetrics(organizationId, campaign.id);
        return {
          ...campaign,
          metrics,
        };
      })
    );

    return campaignsWithMetrics;
  }

  /**
   * Get email engagement trends
   * @param organizationId Organization ID
   * @param days Number of days to look back
   * @returns Engagement trends
   */
  async getEngagementTrends(organizationId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeSeries = await this.getTimeSeriesData(organizationId, startDate, new Date());

    if (timeSeries.length === 0) {
      return {
        averageOpenRate: 0,
        averageClickRate: 0,
        trend: 'stable',
      };
    }

    const totalSent = timeSeries.reduce((sum, day) => sum + day.sent, 0);
    const totalOpened = timeSeries.reduce((sum, day) => sum + day.opened, 0);
    const totalClicked = timeSeries.reduce((sum, day) => sum + day.clicked, 0);

    const averageOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const averageClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Simple trend calculation (compare first half vs second half)
    const halfPoint = Math.floor(timeSeries.length / 2);
    const firstHalf = timeSeries.slice(0, halfPoint);
    const secondHalf = timeSeries.slice(halfPoint);

    const firstHalfOpenRate = this.calculateOpenRate(firstHalf);
    const secondHalfOpenRate = this.calculateOpenRate(secondHalf);

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfOpenRate > firstHalfOpenRate * 1.1) {
      trend = 'improving';
    } else if (secondHalfOpenRate < firstHalfOpenRate * 0.9) {
      trend = 'declining';
    }

    return {
      averageOpenRate,
      averageClickRate,
      trend,
    };
  }

  private calculateOpenRate(data: any[]): number {
    const totalSent = data.reduce((sum, day) => sum + day.sent, 0);
    const totalOpened = data.reduce((sum, day) => sum + day.opened, 0);
    return totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  }
}

export const analyticsService = new AnalyticsService();