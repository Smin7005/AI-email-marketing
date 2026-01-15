'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Save, Mail, Bell, BarChart3, User } from 'lucide-react';

interface Preferences {
  defaultSenderName: string;
  defaultSenderEmail: string;
  defaultTone: string;
  notifications: {
    email: boolean;
    webhook: boolean;
  };
}

interface QuotaData {
  monthlyQuota: number;
  emailsSentThisMonth: number;
  emailsRemaining: number;
  quotaPercentage: number;
  quotaResetDate: string;
  isOverQuota: boolean;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    defaultSenderName: '',
    defaultSenderEmail: '',
    defaultTone: 'professional',
    notifications: { email: true, webhook: false },
  });
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load preferences and quota in parallel
      const [prefsResponse, quotaResponse] = await Promise.all([
        fetch('/api/preferences'),
        fetch('/api/quota'),
      ]);

      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        setPreferences(prefsData);
      }

      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        setQuota(quotaData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(`Failed to save preferences: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your email defaults, notifications, and account preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Defaults</CardTitle>
            </div>
            <CardDescription>
              Set default values for your email campaigns. These will be pre-filled when creating new campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Default Sender Name</Label>
                <Input
                  id="senderName"
                  placeholder="Your Company Name"
                  value={preferences.defaultSenderName}
                  onChange={(e) =>
                    setPreferences({ ...preferences, defaultSenderName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The name recipients will see in their inbox
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Default Sender Email</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  placeholder="hello@yourcompany.com"
                  value={preferences.defaultSenderEmail}
                  onChange={(e) =>
                    setPreferences({ ...preferences, defaultSenderEmail: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Must match your verified Resend domain
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTone">Default Email Tone</Label>
              <Select
                value={preferences.defaultTone}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, defaultTone: value })
                }
              >
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The AI will use this tone when generating email content
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quota Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Email Quota</CardTitle>
            </div>
            <CardDescription>
              Your monthly email sending limits and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quota ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emails sent this month</span>
                    <span className="font-medium">
                      {quota.emailsSentThisMonth} / {quota.monthlyQuota}
                    </span>
                  </div>
                  <Progress value={quota.quotaPercentage * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                    <p className="text-2xl font-bold">{quota.emailsSentThisMonth}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">{quota.emailsRemaining}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Resets On</p>
                    <p className="text-lg font-medium">{formatDate(quota.quotaResetDate)}</p>
                  </div>
                </div>

                {quota.isOverQuota && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-800 font-medium">
                      You have reached your monthly email quota. Upgrade your plan or wait until the quota resets.
                    </p>
                  </div>
                )}

                {quota.quotaPercentage >= 0.8 && !quota.isOverQuota && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                    <p className="text-sm text-yellow-800 font-medium">
                      You have used {Math.round(quota.quotaPercentage * 100)}% of your monthly quota.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Unable to load quota information</p>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you want to receive notifications about your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about campaign status, deliverability, and analytics
                </p>
              </div>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, email: checked },
                  })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send campaign events to your webhook endpoint for integration
                </p>
              </div>
              <Switch
                checked={preferences.notifications.webhook}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, webhook: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>
              Your account information is managed through Clerk authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To update your profile, password, or manage your organization, please use the user menu in the sidebar.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">
              Settings saved successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
