'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { CampaignPreview } from '@/components/campaigns/CampaignPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Folder, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const dynamic = 'force-dynamic';

// SessionStorage key for draft data
const CAMPAIGN_DRAFT_KEY = 'campaign_draft';

// Type for individual recipient
interface IndividualRecipient {
  email: string;
  name: string;
}

// Type for selected collection
interface SelectedCollection {
  id: string;
  name: string;
  itemCount: number;
  businessIds: string[];
  businessNames: string[];
}

// Type for draft data stored in sessionStorage
interface CampaignDraft {
  formData: {
    name: string;
    serviceDescription: string;
    emailTone: string;
  };
  selectedCollections: SelectedCollection[];
  individualRecipients: IndividualRecipient[];
}

function CreateCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewCampaign = searchParams.get('new') === 'true';

  const [formData, setFormData] = useState<{
    name: string;
    serviceDescription: string;
    emailTone: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial form values from sessionStorage
  const [initialFormValues, setInitialFormValues] = useState<{
    name: string;
    serviceDescription: string;
    emailTone: string;
  } | undefined>(undefined);

  // Collections state
  const [collections, setCollections] = useState<Array<{ id: string; name: string; item_count: number }>>([]);
  const [selectedCollections, setSelectedCollections] = useState<SelectedCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  // Individual recipients state
  const [individualRecipients, setIndividualRecipients] = useState<IndividualRecipient[]>([]);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');

  // Track if draft has been loaded
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load draft from sessionStorage on mount (unless starting a new campaign)
  useEffect(() => {
    // If user clicked "Create New Campaign" button, clear any existing draft
    if (isNewCampaign) {
      try {
        sessionStorage.removeItem(CAMPAIGN_DRAFT_KEY);
      } catch (error) {
        console.error('Error clearing draft from sessionStorage:', error);
      }
      // Remove ?new=true from URL so "Back" navigation won't clear draft again
      router.replace('/campaigns/create');
      setIsDraftLoaded(true);
      return;
    }

    // Otherwise, try to load existing draft
    try {
      const savedDraft = sessionStorage.getItem(CAMPAIGN_DRAFT_KEY);
      if (savedDraft) {
        const draft: CampaignDraft = JSON.parse(savedDraft);
        if (draft.formData) {
          setInitialFormValues(draft.formData);
          setFormData(draft.formData);
        }
        if (draft.selectedCollections) {
          setSelectedCollections(draft.selectedCollections);
        }
        if (draft.individualRecipients) {
          setIndividualRecipients(draft.individualRecipients);
        }
      }
    } catch (error) {
      console.error('Error loading draft from sessionStorage:', error);
    }
    setIsDraftLoaded(true);
  }, [isNewCampaign, router]);

  // Save draft to sessionStorage when state changes
  const saveDraft = useCallback((
    currentFormData: { name: string; serviceDescription: string; emailTone: string } | null,
    currentSelectedCollections: SelectedCollection[],
    currentIndividualRecipients: IndividualRecipient[]
  ) => {
    try {
      const draft: CampaignDraft = {
        formData: currentFormData || { name: '', serviceDescription: '', emailTone: '' },
        selectedCollections: currentSelectedCollections,
        individualRecipients: currentIndividualRecipients,
      };
      sessionStorage.setItem(CAMPAIGN_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Error saving draft to sessionStorage:', error);
    }
  }, []);

  // Save draft when recipients change
  useEffect(() => {
    if (isDraftLoaded) {
      saveDraft(formData, selectedCollections, individualRecipients);
    }
  }, [selectedCollections, individualRecipients, isDraftLoaded, saveDraft, formData]);

  // Handle form value changes from CampaignForm
  const handleFormChange = useCallback((values: { name: string; serviceDescription: string; emailTone: string }) => {
    setFormData(values);
    if (isDraftLoaded) {
      saveDraft(values, selectedCollections, individualRecipients);
    }
  }, [isDraftLoaded, saveDraft, selectedCollections, individualRecipients]);

  // Clear draft from sessionStorage
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(CAMPAIGN_DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft from sessionStorage:', error);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoadingCollections(true);
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('Failed to load collections');
      }
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
      alert('Failed to load collections. Please try again.');
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleCollectionToggle = async (collectionId: string) => {
    // Check if already selected
    const isSelected = selectedCollections.some(c => c.id === collectionId);

    if (isSelected) {
      // Remove from selection
      setSelectedCollections(prev => prev.filter(c => c.id !== collectionId));
    } else {
      // Add to selection - fetch businesses first
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return;

      try {
        const response = await fetch(`/api/collections/${collectionId}/items`);
        if (!response.ok) {
          throw new Error('Failed to load collection items');
        }
        const data = await response.json();

        setSelectedCollections(prev => [...prev, {
          id: collectionId,
          name: collection.name,
          itemCount: collection.item_count,
          businessIds: data.ids || [],
          businessNames: data.names || [],
        }]);
      } catch (error) {
        console.error('Error loading collection items:', error);
        alert('Failed to load businesses from collection. Please try again.');
      }
    }
  };

  const handleRemoveCollection = (collectionId: string) => {
    setSelectedCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  const handleRemoveIndividualRecipient = (email: string) => {
    setIndividualRecipients(prev => prev.filter(r => r.email !== email));
  };

  const handleAddRecipient = () => {
    if (!newRecipientEmail.trim()) {
      alert('Please enter an email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipientEmail.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    // Check for duplicates
    if (individualRecipients.some(r => r.email === newRecipientEmail.trim())) {
      alert('This email address has already been added.');
      return;
    }

    setIndividualRecipients(prev => [...prev, {
      email: newRecipientEmail.trim(),
      name: newRecipientName.trim(),
    }]);

    // Reset and close modal
    setNewRecipientEmail('');
    setNewRecipientName('');
    setIsAddModalOpen(false);
  };

  // Calculate total recipients
  const totalCollectionRecipients = selectedCollections.reduce((sum, c) => sum + c.businessIds.length, 0);
  const totalRecipients = totalCollectionRecipients + individualRecipients.length;

  // Get all business names for preview
  const allBusinessNames = [
    ...selectedCollections.flatMap(c => c.businessNames),
    ...individualRecipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email),
  ];

  // Get all business IDs for submission
  const allBusinessIds = selectedCollections.flatMap(c => c.businessIds);

  const handleSubmit = async (values: {
    name: string;
    serviceDescription: string;
    emailTone: string;
  }) => {
    // Check prerequisites
    if (selectedCollections.length === 0 && individualRecipients.length === 0) {
      alert('Please select at least one collection or add individual recipients.');
      return;
    }

    setIsSubmitting(true);
    setFormData(values);

    try {
      const requestBody: any = {
        name: values.name,
        serviceDescription: values.serviceDescription,
        emailTone: values.emailTone,
      };

      // Include collection business IDs if any
      if (allBusinessIds.length > 0) {
        requestBody.businessIds = allBusinessIds.map((id: string) => parseInt(id, 10));
        // Use first collection ID for backward compatibility
        if (selectedCollections.length > 0) {
          requestBody.collectionId = parseInt(selectedCollections[0].id, 10);
        }
      }

      // Include individual recipients if any
      if (individualRecipients.length > 0) {
        requestBody.individualRecipients = individualRecipients;
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

      // Don't clear draft here - user may want to go back and modify
      // Draft will be cleared when user navigates to campaigns list or creates a new campaign

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

          {/* Capsule Elements for Collections and Add Button */}
          <div className="flex flex-wrap items-center gap-3">
            {isLoadingCollections ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading collections...</span>
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md w-full">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No collections found</p>
                <p className="text-xs text-gray-500">Save businesses to collections from the Leads page first</p>
              </div>
            ) : (
              <>
                {/* Collection Capsules */}
                {collections.map((col) => {
                  const isSelected = selectedCollections.some(c => c.id === col.id);
                  return (
                    <div
                      key={col.id}
                      className={`relative inline-flex items-center px-4 py-2 rounded-full border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-100 border-neutral-400 shadow-sm'
                          : 'bg-white border-neutral-300 hover:border-neutral-400'
                      }`}
                      onClick={() => handleCollectionToggle(col.id)}
                    >
                      <span className="text-sm font-medium text-neutral-700">{col.name}</span>
                      {isSelected && (
                        <button
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCollection(col.id);
                          }}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Individual Recipient Capsules */}
                {individualRecipients.map((recipient) => (
                  <div
                    key={recipient.email}
                    className="relative inline-flex items-center px-4 py-2 rounded-full border bg-blue-50 border-blue-300"
                  >
                    <span className="text-sm font-medium text-blue-700">
                      {recipient.name || recipient.email}
                    </span>
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      onClick={() => handleRemoveIndividualRecipient(recipient.email)}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}

                {/* Add Button */}
                <button
                  className="inline-flex items-center px-4 py-2 rounded-full border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="text-sm">Add</span>
                </button>
              </>
            )}
          </div>

          {/* Selected Recipients Summary Grid */}
          {(selectedCollections.length > 0 || individualRecipients.length > 0) && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h4 className="text-sm font-medium text-neutral-700 mb-3">
                Selected Recipients ({totalRecipients} total)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Collection Items */}
                {selectedCollections.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <Folder className="w-5 h-5 text-neutral-500 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 truncate">{col.name}</p>
                      <p className="text-xs text-neutral-500">{col.businessIds.length} businesses</p>
                    </div>
                    <button
                      className="ml-2 p-1 hover:bg-neutral-200 rounded transition-colors"
                      onClick={() => handleRemoveCollection(col.id)}
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                ))}

                {/* Individual Recipients */}
                {individualRecipients.map((recipient) => (
                  <div
                    key={recipient.email}
                    className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs text-white font-medium">
                        {(recipient.name || recipient.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-800 truncate">
                        {recipient.name || 'Individual'}
                      </p>
                      <p className="text-xs text-blue-600 truncate">{recipient.email}</p>
                    </div>
                    <button
                      className="ml-2 p-1 hover:bg-blue-100 rounded transition-colors"
                      onClick={() => handleRemoveIndividualRecipient(recipient.email)}
                    >
                      <X className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Individual Recipient Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-neutral-700">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-neutral-700">
                Recipient Name
              </label>
              <Input
                type="text"
                placeholder="Enter recipient name"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewRecipientEmail('');
                setNewRecipientName('');
                setIsAddModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRecipient}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isDraftLoaded ? (
              <CampaignForm
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                initialValues={initialFormValues}
                onChange={handleFormChange}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {formData && (
            <CampaignPreview
              name={formData.name}
              serviceDescription={formData.serviceDescription}
              emailTone={formData.emailTone}
              businessCount={totalRecipients}
              selectedBusinessNames={allBusinessNames}
              isManualMode={individualRecipients.length > 0 && selectedCollections.length === 0}
            />
          )}

          {/* Selected Businesses Summary */}
          {totalRecipients > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {totalRecipients} recipient(s) selected
                </p>
                {allBusinessNames.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allBusinessNames.slice(0, 20).map((name, index) => (
                      <p key={index} className="text-sm">
                        • {name}
                      </p>
                    ))}
                    {allBusinessNames.length > 20 && (
                      <p className="text-sm text-gray-500 italic">
                        ... and {allBusinessNames.length - 20} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {totalRecipients} recipient(s) selected
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

// Loading fallback for Suspense
function CreateCampaignLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </div>
  );
}

// Wrap in Suspense boundary for useSearchParams
export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<CreateCampaignLoading />}>
      <CreateCampaignContent />
    </Suspense>
  );
}
