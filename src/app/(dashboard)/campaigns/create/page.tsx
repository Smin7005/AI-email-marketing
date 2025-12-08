'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { CampaignPreview } from '@/components/campaigns/CampaignPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [selectedBusinessNames, setSelectedBusinessNames] = useState<string[]>(
    []
  );
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
    if (selectedBusinessIds.length === 0) {
      alert('No businesses selected. Please go back and select businesses first.');
      return;
    }

    setIsSubmitting(true);
    setFormData(values);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          serviceDescription: values.serviceDescription,
          emailTone: values.emailTone,
          businessIds: selectedBusinessIds,
        }),
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

  if (selectedBusinessIds.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
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
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              No businesses selected. Please go back to the businesses page and
              select some businesses to create a campaign.
            </p>
            <Button
              onClick={() => router.push('/businesses')}
              className="w-full mt-4"
            >
              Go to Businesses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              businessCount={selectedBusinessIds.length}
              selectedBusinessNames={selectedBusinessNames}
            />
          )}

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
        </div>
      </div>
    </div>
  );
}
