"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuotaProgressBar } from './QuotaProgressBar';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuotaInfo {
  monthlyQuota: number;
  emailsSentThisMonth: number;
  emailsRemaining: number;
  quotaPercentage: number;
  quotaResetDate: Date;
  isOverQuota: boolean;
  warningThreshold: number;
}

export function QuotaDisplay() {
  const { data, isLoading, error, refetch } = useQuery<QuotaInfo>({
    queryKey: ['quota'],
    queryFn: async () => {
      const response = await fetch('/api/quota');
      if (!response.ok) {
        throw new Error('Failed to fetch quota');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading Quota...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            Quota Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load quota information.
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const {
    monthlyQuota,
    emailsSentThisMonth,
    emailsRemaining,
    quotaPercentage,
    quotaResetDate,
    isOverQuota,
  } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Monthly Quota
          </CardTitle>
          {isOverQuota && (
            <Badge variant="destructive">Over Limit</Badge>
          )}
          {quotaPercentage >= 80 && !isOverQuota && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Warning
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <QuotaProgressBar
          used={emailsSentThisMonth}
          limit={monthlyQuota}
          className="mb-3"
        />
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Reset Date:</span>
            <span className="font-medium">
              {new Date(quotaResetDate).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${isOverQuota ? 'text-red-600' : ''}`}>
              {isOverQuota
                ? 'Exceeded'
                : quotaPercentage >= 80
                ? 'Near Limit'
                : 'Healthy'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
