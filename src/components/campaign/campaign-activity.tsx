'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: number;
  type: string;
  description: string;
  occurredAt: string;
  campaignItemId: number;
}

interface CampaignActivityProps {
  campaignId: string;
}

export default function CampaignActivity({ campaignId }: CampaignActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // Refresh every 10 seconds
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'delivered':
        return 'default';
      case 'opened':
        return 'default';
      case 'clicked':
        return 'default';
      case 'bounced':
        return 'destructive';
      case 'complained':
        return 'destructive';
      default:
        return 'secondary';
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-8">
            No activity yet. Activity will appear here as emails are sent and interacted with.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <Badge variant={getActivityBadgeVariant(activity.type)}>
                {activity.type}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTime(activity.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}