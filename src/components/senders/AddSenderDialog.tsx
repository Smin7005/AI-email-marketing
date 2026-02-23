'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import { DnsRecordsDisplay } from './DnsRecordsDisplay';

interface DnsRecord {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
  purpose: 'domain_verification' | 'dkim';
  status?: 'pending' | 'verified';
}

interface AddSenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSenderDialog({ open, onOpenChange, onSuccess }: AddSenderDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [emailAddress, setEmailAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  // Listen for Nylas OAuth popup completion
  const handleNylasCallback = useCallback(() => {
    onSuccess();
    onOpenChange(false);
  }, [onSuccess, onOpenChange]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'nylas-auth-complete') {
        handleNylasCallback();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleNylasCallback]);

  // Handle Custom Domain submit (existing SES flow)
  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAddress, provider: 'ses' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add sender');
      }

      // Move to step 2 with DNS records
      setDnsRecords(data.dnsRecords);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sender');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Personal Email submit (Nylas OAuth flow)
  const handleNylasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAddress, provider: 'nylas' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect email');
      }

      // Open Nylas OAuth in a popup window
      if (data.authUrl) {
        const popup = window.open(
          data.authUrl,
          'nylas-auth',
          'width=600,height=700,left=200,top=100'
        );

        // Poll for popup close (in case postMessage doesn't work)
        if (popup) {
          const pollInterval = setInterval(() => {
            if (popup.closed) {
              clearInterval(pollInterval);
              // Refresh senders list and close dialog
              handleNylasCallback();
            }
          }, 1000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setActiveTab('personal');
    setEmailAddress('');
    setError(null);
    setDnsRecords([]);
    onOpenChange(false);

    // If we completed step 2 (domain flow), trigger refresh
    if (step === 2) {
      onSuccess();
    }
  };

  const handleDone = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Which email address would you like to use?
              </DialogTitle>
              <DialogDescription>
                Choose how you want to connect your email for sending campaigns.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal" className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  Personal Email
                </TabsTrigger>
                <TabsTrigger value="domain" className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Custom Domain
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <form onSubmit={handleNylasSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Email Address</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      placeholder="you@gmail.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Connect your email account (Gmail, Outlook, etc.). You will be redirected to sign in with your email provider.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !emailAddress}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect Email
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="domain">
                <form onSubmit={handleDomainSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="domainEmail">Email Address</Label>
                    <Input
                      id="domainEmail"
                      type="email"
                      placeholder="hello@yourdomain.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      We will verify the domain ownership via DNS records.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !emailAddress}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          Add Sender
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Configure DNS Records
              </DialogTitle>
              <DialogDescription>
                Add these DNS records to your domain provider to verify ownership.
                Once verified, you can start sending emails from this address.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <DnsRecordsDisplay records={dnsRecords} />

              <div className="mt-6 flex justify-end">
                <Button onClick={handleDone}>
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
