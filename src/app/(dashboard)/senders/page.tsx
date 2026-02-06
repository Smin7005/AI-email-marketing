'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { SenderTable } from '@/components/senders/SenderTable';
import { AddSenderDialog } from '@/components/senders/AddSenderDialog';
import { toast } from 'sonner';

interface Sender {
  id: number;
  emailAddress: string;
  domain: string;
  verificationStatus: string;
  dkimStatus: string | null;
  isDefault: boolean;
  createdAt: string;
}

export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchSenders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/senders');

      if (!response.ok) {
        throw new Error('Failed to fetch senders');
      }

      const data = await response.json();
      setSenders(data.senders || []);
    } catch (error) {
      console.error('Error fetching senders:', error);
      toast.error('Failed to load senders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/senders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete sender');
      }

      toast.success('Sender deleted successfully');
      fetchSenders();
    } catch (error) {
      console.error('Error deleting sender:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete sender');
    }
  };

  const handleVerify = async (id: number) => {
    try {
      const response = await fetch(`/api/senders/${id}/verify`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check verification');
      }

      const data = await response.json();

      if (data.verificationDetails?.isFullyVerified) {
        toast.success('Domain is fully verified!');
      } else {
        toast.info('Verification status updated. DNS records may still be propagating.');
      }

      fetchSenders();
    } catch (error) {
      console.error('Error verifying sender:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to check verification');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/senders/${id}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set default sender');
      }

      toast.success('Default sender updated');
      fetchSenders();
    } catch (error) {
      console.error('Error setting default sender:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set default sender');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Senders</h1>
          <p className="text-muted-foreground mt-1">
            Manage email addresses for sending campaigns
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add sender
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0" />
        <CardContent className="p-0">
          <SenderTable
            senders={senders}
            isLoading={isLoading}
            onRefresh={fetchSenders}
            onDelete={handleDelete}
            onVerify={handleVerify}
            onSetDefault={handleSetDefault}
          />
        </CardContent>
      </Card>

      <AddSenderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchSenders}
      />
    </div>
  );
}
