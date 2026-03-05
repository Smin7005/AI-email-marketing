'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsSummary {
  totalCampaigns: number;
  totalEmails: number;
  sentEmails: number;
  openedEmails: number;
  clickedEmails: number;
  openRate: number;
  clickRate: number;
  bounceCount: number;
  complaintCount: number;
}

interface CampaignAnalytics {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  totalEmails: number;
  sentEmails: number;
  openRate: number;
  clickRate: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  campaignName: string;
  occurredAt: string;
}

interface ChartDataPoint {
  label: string;
  totalCampaigns: number;
  totalEmails: number;
  sentEmails: number;
  openRate: number;
}

type ChartPeriod = '1d' | '7d' | '30d';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchChartData = useCallback(async (period: ChartPeriod) => {
    try {
      setChartLoading(true);
      const response = await fetch(`/api/analytics/chart?period=${period}`);
      if (!response.ok) return;
      const data = await response.json();
      setChartData(data.data || []);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod, fetchChartData]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setSummary(data.summary);
      setCampaigns(data.campaigns || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'sending':
        return 'default';
      case 'ready':
        return 'secondary';
      case 'generating':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const periodLabels: Record<ChartPeriod, string> = {
    '1d': '1D',
    '7d': '7D',
    '30d': '30D',
  };

  const hasChartData = chartData.some(
    d => d.totalCampaigns > 0 || d.totalEmails > 0 || d.sentEmails > 0 || d.openRate > 0
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Overview of all your email campaigns</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCampaigns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmails}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sent Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.sentEmails}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.openRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Chart */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trends</CardTitle>
            <div className="flex gap-1">
              {(['1d', '7d', '30d'] as ChartPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    chartPeriod === p
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse h-full w-full bg-gray-100 rounded"></div>
            </div>
          ) : !hasChartData ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#f97316" unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  // @ts-expect-error recharts formatter overload mismatch
                  formatter={(value: unknown, name: string) => {
                    if (name === 'Open Rate') return [`${value ?? 0}%`, name];
                    return [value ?? 0, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="totalCampaigns" name="Total Campaigns" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="left" dataKey="totalEmails" name="Total Emails" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="left" dataKey="sentEmails" name="Sent Emails" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" name="Open Rate" stroke="#f97316" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(campaign.createdAt)} • {campaign.totalEmails} emails
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <span className="text-gray-600">
                        {campaign.openRate.toFixed(1)}% open
                      </span>
                      <span className="text-gray-600">
                        {campaign.clickRate.toFixed(1)}% click
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">
                  No campaigns found. Create your first campaign to see analytics.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <Badge variant="secondary" className="mt-0.5">
                      {activity.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.campaignName} • {formatTime(activity.occurredAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">
                  No recent activity. Activity will appear here as emails are sent and interacted with.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
