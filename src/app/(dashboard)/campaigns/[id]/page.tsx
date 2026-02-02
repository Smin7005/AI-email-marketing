'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CampaignActivity from '@/components/campaign/campaign-activity';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Campaign {
  id: number;
  name: string;
  serviceDescription: string;
  emailTone: string;
  status: 'draft' | 'generating' | 'ready' | 'sending' | 'sent';
  totalRecipients: number;
  generatedCount: number;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CampaignItem {
  id: number;
  businessId: number;
  businessName: string;
  businessEmail: string;
  status: 'pending' | 'generated' | 'sending' | 'sent' | 'failed' | 'opened' | 'clicked';
  subject?: string;
  emailContent?: string;
  errorMessage?: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;

  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<number | null>(null);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }
      return response.json();
    },
    // Auto-refresh every 1 seconds while generating or sending
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'generating' || status === 'sending') {
        return 1000;
      }
      return false;
    },
  });

  const {
    data: campaignItems,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useQuery<CampaignItem[]>({
    queryKey: ['campaign-items', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign items');
      }
      const data = await response.json();
      return data;
    },
    refetchInterval: (data) => {
      // Auto-refresh every 3 seconds if generation or sending is in progress
      if (campaign?.status === 'generating' || campaign?.status === 'sending') {
        return 3000;
      }
      return false;
    },
  });

  const startGenerationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start generation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({
        queryKey: ['campaign-items', campaignId],
      });
      setIsStartingGeneration(false);
    },
    onError: () => {
      setIsStartingGeneration(false);
      alert('Failed to start generation. Please try again.');
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({
        queryKey: ['campaign-items', campaignId],
      });
      setIsSendingCampaign(false);
    },
    onError: () => {
      setIsSendingCampaign(false);
      alert('Failed to send campaign. Please try again.');
    },
  });

  const handleStartGeneration = () => {
    setIsStartingGeneration(true);
    startGenerationMutation.mutate();
  };

  const handleSendCampaign = () => {
    console.log('[DEBUG] handleSendCampaign CALLED!');
    console.log('[DEBUG] showSendConfirmation before:', showSendConfirmation);
    setShowSendConfirmation(true);
    console.log('[DEBUG] setShowSendConfirmation(true) executed');
  };

  const confirmSendCampaign = () => {
    setShowSendConfirmation(false);
    setIsSendingCampaign(true);
    sendCampaignMutation.mutate();
  };

  const handleRegenerateEmail = async (itemId: number) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/items/${itemId}/regenerate`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to regenerate email');
      }
      queryClient.invalidateQueries({
        queryKey: ['campaign-items', campaignId],
      });
    } catch (error) {
      console.error('Error regenerating email:', error);
      alert('Failed to regenerate email. Please try again.');
    }
  };

  const toggleExpandItem = (itemId: number) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleCopyToClipboard = async (content: string, itemId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedItemId(itemId);
      setTimeout(() => setCopiedItemId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

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

  const getItemStatusBadge = (status: CampaignItem['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      generated: { label: 'Generated', variant: 'default' as const },
      sending: { label: 'Sending', variant: 'default' as const },
      sent: { label: 'Sent', variant: 'default' as const },
      opened: { label: 'Opened', variant: 'default' as const },
      clicked: { label: 'Clicked', variant: 'default' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (campaignLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Campaign not found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage =
    campaign.totalRecipients > 0
      ? Math.round((campaign.generatedCount / campaign.totalRecipients) * 100)
      : 0;

  const sentPercentage =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(campaign.status)}
              <span className="text-sm text-gray-600">
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {campaign.status === 'draft' && (
            <Button
              onClick={handleStartGeneration}
              disabled={isStartingGeneration}
            >
              <Play className="w-4 h-4 mr-2" />
              {isStartingGeneration ? 'Starting...' : 'Start AI Generation'}
            </Button>
          )}
          {campaign.status === 'ready' && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[DEBUG] Button clicked!');
                handleSendCampaign();
              }}
              disabled={isSendingCampaign}
              className="bg-green-600 hover:bg-green-700"
              type="button"
            >
              <Send className="w-4 h-4 mr-2" />
              Review & Send Campaign
            </Button>
          )}
          {campaign.status === 'sending' && (
            <Badge variant="default" className="bg-blue-500 animate-pulse px-4 py-2">
              <Send className="w-4 h-4 mr-2 animate-spin" />
              Sending in Progress...
            </Badge>
          )}
          {campaign.status === 'sent' && (
            <Badge variant="default" className="bg-green-600 px-4 py-2">
              Campaign Sent Successfully
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Merged: Sent Progress Card - spans 2 columns */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Sent Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.sentCount}/{campaign.totalRecipients}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${sentPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {sentPercentage}% sent
              </p>
            </CardContent>
          </Card>

          {/* Email Tone Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Email Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {campaign.emailTone}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        {(campaign.status === 'sent' || campaign.status === 'sending') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignItems?.filter((item) =>
                    ['sent', 'opened', 'clicked'].includes(item.status)
                  ).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sentCount =
                    campaignItems?.filter((item) =>
                      ['sent', 'opened', 'clicked'].includes(item.status)
                    ).length || 0;
                  const openedCount =
                    campaignItems?.filter((item) =>
                      ['opened', 'clicked'].includes(item.status)
                    ).length || 0;
                  const openRate =
                    sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
                  return <div className="text-2xl font-bold">{openRate}%</div>;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sentCount =
                    campaignItems?.filter((item) =>
                      ['sent', 'opened', 'clicked'].includes(item.status)
                    ).length || 0;
                  const clickedCount =
                    campaignItems?.filter((item) => item.status === 'clicked')
                      .length || 0;
                  const clickRate =
                    sentCount > 0
                      ? Math.round((clickedCount / sentCount) * 100)
                      : 0;
                  return <div className="text-2xl font-bold">{clickRate}%</div>;
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{campaign.serviceDescription}</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Recent Activity Section */}
      {(campaign.status === 'sent' || campaign.status === 'sending') && (
        <div className="mb-8">
          <CampaignActivity campaignId={campaignId} />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Campaign Emails</h2>
        {itemsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : campaignItems && campaignItems.length > 0 ? (
          <div className="space-y-4">
            {campaignItems.map((item) => (
                <Card
                  key={item.id}
                  className={`mb-4 transition-all duration-200 ${expandedItemId === item.id ? 'border-2 border-blue-500 shadow-md ring-1 ring-blue-500' : 'border border-gray-200'}`}
                >
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 p-4"
                    onClick={() => toggleExpandItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-gray-900">{item.businessName}</h3>
                        <p className="text-sm text-gray-500">{item.businessEmail}</p>
                      </div>
                      {/* Status Badge */}
                      <Badge variant={item.status === 'generated' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* FORCE RENDER CHECK */}
                  {expandedItemId === item.id && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 block">
                      <div className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Email Content Preview
                      </div>
                      <div
                        className="p-4 bg-white border border-gray-200 rounded shadow-sm text-sm text-gray-800 min-h-[100px]"
                        dangerouslySetInnerHTML={{
                          __html: item.emailContent || '<span class="text-gray-400">No content available</span>'
                        }}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyToClipboard(item.emailContent || '', item.id)}
                        >
                          {copiedItemId === item.id ? 'Copied!' : 'Copy to Clipboard'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                No emails generated yet. Start the AI generation to create
                personalized emails for your prospects.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirmation} onOpenChange={setShowSendConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Campaign Send
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  You are about to send <strong>{campaign?.name}</strong> to{' '}
                  <strong>{campaign?.totalRecipients} recipients</strong>.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                  <p className="font-medium text-yellow-800">Before sending, please verify:</p>
                  <ul className="list-disc list-inside mt-2 text-yellow-700 space-y-1">
                    <li>All email content has been reviewed</li>
                    <li>Recipient list is correct</li>
                    <li>Sender email is properly configured</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. Emails will be sent immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendCampaign}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Campaign Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
