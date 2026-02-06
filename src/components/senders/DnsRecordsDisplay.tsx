'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface DnsRecord {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
  purpose: 'domain_verification' | 'dkim';
  status?: 'pending' | 'verified';
}

interface DnsRecordsDisplayProps {
  records: DnsRecord[];
}

export function DnsRecordsDisplay({ records }: DnsRecordsDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'domain_verification':
        return 'Domain Verification';
      case 'dkim':
        return 'DKIM';
      default:
        return purpose;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          Add these DNS records to your domain provider (e.g., Cloudflare) to verify your domain.
          DNS changes may take up to 72 hours to propagate.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Purpose</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="border-b">
                <td className="py-3 px-4">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {record.type}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs break-all max-w-[200px]">
                  {record.name}
                </td>
                <td className="py-3 px-4 font-mono text-xs break-all max-w-[300px]">
                  {record.value}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    record.purpose === 'domain_verification'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {getPurposeLabel(record.purpose)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(record.value, index)}
                    className="h-8 px-2"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="ml-1 text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="ml-1">Copy</span>
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
