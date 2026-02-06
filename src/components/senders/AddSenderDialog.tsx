'use client';

import { useState } from 'react';
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
import { Loader2, Mail, ArrowRight, CheckCircle } from 'lucide-react';
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
  const [emailAddress, setEmailAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAddress }),
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

  const handleClose = () => {
    // Reset state
    setStep(1);
    setEmailAddress('');
    setError(null);
    setDnsRecords([]);
    onOpenChange(false);

    // If we completed step 2, trigger refresh
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
                Enter the email address you want to use for sending campaigns.
                We will verify the domain ownership via DNS records.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="hello@yourdomain.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This email will be used as the sender for your campaigns
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
