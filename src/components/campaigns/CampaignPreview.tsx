'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignPreviewProps {
  name: string;
  serviceDescription: string;
  emailTone: string;
  businessCount: number;
  selectedBusinessNames?: string[];
  isManualMode?: boolean;
}

export function CampaignPreview({
  name,
  serviceDescription,
  emailTone,
  businessCount,
  selectedBusinessNames = [],
  isManualMode = false,
}: CampaignPreviewProps) {
  const toneLabels: Record<string, string> = {
    professional: 'Professional',
    friendly: 'Friendly',
    casual: 'Casual',
    formal: 'Formal',
    enthusiastic: 'Enthusiastic',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              {toneLabels[emailTone] || emailTone} tone
            </Badge>
            <Badge variant="outline">
              {isManualMode ? '1 recipient' : `${businessCount} prospects`}
            </Badge>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Service Description</h4>
          <p className="text-sm text-gray-600">{serviceDescription}</p>
        </div>

        {selectedBusinessNames.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">
              {isManualMode ? 'Recipient' : 'Selected Prospects'} ({selectedBusinessNames.length})
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedBusinessNames.map((business, index) => (
                <p key={index} className="text-sm text-gray-600">
                  • {business}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">What happens next?</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            {isManualMode ? (
              <>
                <li>AI will generate a personalized email</li>
                <li>You'll be able to review and edit the email before sending</li>
                <li>Track opens, clicks, and responses in real-time</li>
              </>
            ) : (
              <>
                <li>AI will generate personalized emails for each prospect</li>
                <li>You'll be able to review and edit emails before sending</li>
                <li>Track opens, clicks, and responses in real-time</li>
              </>
            )}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
