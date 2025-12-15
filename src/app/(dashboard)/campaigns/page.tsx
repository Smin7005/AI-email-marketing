'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Campaign {
  id: number;
  name: string;
  serviceDescription: string;
  emailTone: string;
  status: 'draft' | 'generating' | 'ready' | 'sending' | 'sent';
  totalRecipients: number;
  generatedCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignsPage() {
  const router = useRouter();

  const {
    data: responseData,
    isLoading,
    error,
  } = useQuery<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json();
    },
  });

  const campaigns = responseData?.campaigns;

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      generating: { label: 'Generating', variant: 'default' as const },
      ready: { label: 'Ready', variant: 'default' as const },
      sending: { label: 'Sending', variant: 'default' as const },
      sent: { label: 'Sent', variant: 'default' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Failed to load campaigns. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Manage your AI-powered email campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/create">
            <Plus className="w-4 h-4 mr-2" />
            Create New Campaign
          </Link>
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                No campaigns yet. Create your first campaign to get started.
              </p>
              <Button asChild>
                <Link href="/campaigns/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {campaign.serviceDescription}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recipients:</span>
                    <span className="font-medium">{campaign.totalRecipients}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Generated:</span>
                    <span className="font-medium">
                      {campaign.generatedCount}/{campaign.totalRecipients}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tone:</span>
                    <span className="font-medium capitalize">{campaign.emailTone}</span>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
