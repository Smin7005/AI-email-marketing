'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { CampaignPreview } from '@/components/campaigns/CampaignPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [selectedBusinessNames, setSelectedBusinessNames] = useState<string[]>(
    []
  );
  const [recipientMode, setRecipientMode] = useState<'collection' | 'manual'>('collection');
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    serviceDescription: string;
    emailTone: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get selected businesses from session storage
    const storedIds = sessionStorage.getItem('selectedBusinesses');
    if (storedIds) {
      const ids = JSON.parse(storedIds);
      setSelectedBusinessIds(ids);

      // Also get the business names if available
      const storedNames = sessionStorage.getItem('selectedBusinessNames');
      if (storedNames) {
        setSelectedBusinessNames(JSON.parse(storedNames));
      }
    }

    // Clear the session storage after reading
    sessionStorage.removeItem('selectedBusinesses');
    sessionStorage.removeItem('selectedBusinessNames');
  }, []);

  const handleSubmit = async (values: {
    name: string;
    serviceDescription: string;
    emailTone: string;
  }) => {
    // Check prerequisites based on mode
    if (recipientMode === 'manual') {
      if (!manualEmail || manualEmail.trim() === '') {
        alert('Please enter an email address.');
        return;
      }
    } else {
      if (selectedBusinessIds.length === 0) {
        alert('No businesses selected. Please go back and select businesses first.');
        return;
      }
    }

    setIsSubmitting(true);
    setFormData(values);

    try {
      const requestBody: any = {
        name: values.name,
        serviceDescription: values.serviceDescription,
        emailTone: values.emailTone,
      };

      if (recipientMode === 'manual') {
        requestBody.manualEmail = manualEmail.trim();
        if (manualName.trim()) {
          requestBody.manualName = manualName.trim();
        }
      } else {
        requestBody.businessIds = selectedBusinessIds;
      }

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const campaign = await response.json();

      // Redirect to the campaign detail page
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-gray-600 mt-2">
          Create an AI-generated email campaign for your selected prospects
        </p>
      </div>

      {/* Recipients Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Recipients</h3>

          {/* Radio Button Options */}
          <div className="space-y-3 mb-4">
            <div
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                recipientMode === 'collection'
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => setRecipientMode('collection')}
            >
              <input
                type="radio"
                checked={recipientMode === 'collection'}
                onChange={() => setRecipientMode('collection')}
                className="mr-3 h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium">From Collection</div>
                <div className="text-sm text-gray-500">
                  Select businesses from your saved collections
                </div>
              </div>
            </div>

            <div
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                recipientMode === 'manual'
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => setRecipientMode('manual')}
            >
              <input
                type="radio"
                checked={recipientMode === 'manual'}
                onChange={() => setRecipientMode('manual')}
                className="mr-3 h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium">Manual Entry</div>
                <div className="text-sm text-gray-500">
                  Enter a single email address manually
                </div>
              </div>
            </div>
          </div>

          {/* Manual Entry Fields */}
          {recipientMode === 'manual' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Recipient Name (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Enter recipient name (e.g., John Smith)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address (e.g., john@example.com)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {formData && (
            <CampaignPreview
              name={formData.name}
              serviceDescription={formData.serviceDescription}
              emailTone={formData.emailTone}
              businessCount={recipientMode === 'manual' ? 1 : selectedBusinessIds.length}
              selectedBusinessNames={
                recipientMode === 'manual'
                  ? [manualName ? `${manualName} <${manualEmail}>` : manualEmail || 'Manual Recipient']
                  : selectedBusinessNames
              }
              isManualMode={recipientMode === 'manual'}
            />
          )}

          {/* Selected Businesses - Only show when in collection mode */}
          {recipientMode === 'collection' && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedBusinessIds.length} business(es) selected
                </p>
                {selectedBusinessNames.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {selectedBusinessNames.map((name, index) => (
                      <p key={index} className="text-sm">
                        • {name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Business names not available, but {selectedBusinessIds.length}{' '}
                    business(es) are selected
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
