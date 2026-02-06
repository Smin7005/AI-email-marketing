'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Trash2, RefreshCw, Star, Loader2, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Sender {
  id: number;
  emailAddress: string;
  domain: string;
  verificationStatus: string;
  dkimStatus: string | null;
  isDefault: boolean;
  createdAt: string;
}

interface SenderTableProps {
  senders: Sender[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => Promise<void>;
  onVerify: (id: number) => Promise<void>;
  onSetDefault: (id: number) => Promise<void>;
}

export function SenderTable({
  senders,
  isLoading,
  onRefresh,
  onDelete,
  onVerify,
  onSetDefault,
}: SenderTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleDelete = async () => {
    if (deleteId === null) return;

    setActionLoading(deleteId);
    try {
      await onDelete(deleteId);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const handleVerify = async (id: number) => {
    setActionLoading(id);
    try {
      await onVerify(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    setActionLoading(id);
    try {
      await onSetDefault(id);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (senders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No senders yet</h3>
        <p className="text-muted-foreground mt-1">
          Click &quot;+ Add sender&quot; to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Email Address
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Created
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {senders.map((sender) => (
              <tr key={sender.id} className="border-b hover:bg-muted/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{sender.emailAddress}</span>
                    {sender.isDefault && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(sender.verificationStatus)}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {formatDate(sender.createdAt)}
                </td>
                <td className="py-3 px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading === sender.id}
                      >
                        {actionLoading === sender.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleVerify(sender.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Verification
                      </DropdownMenuItem>
                      {sender.verificationStatus === 'verified' && !sender.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(sender.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(sender.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="py-3 px-4 text-sm text-muted-foreground">
        Page 1 - {senders.length} of {senders.length} senders
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sender</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sender? This action cannot be undone.
              Any campaigns using this sender will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
