import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { showToast } from '../../components/ui/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEmails: boolean;
  reminderFrequency: 'none' | 'normal' | 'extra';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  language: string;
}

export const ProfileNotifications: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    marketingEmails: false,
    reminderFrequency: 'normal',
    quietHoursStart: '',
    quietHoursEnd: '',
    language: 'en'
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/dashboard/notifications/preferences');
      if (response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      showToast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/dashboard/notifications/preferences', preferences);
      showToast.success('Notification preferences updated');
    } catch (error) {
      showToast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-7 w-48 mb-6" />

        {/* Communication Channels Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-52" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          </div>

          {/* Other sections skeletons */}
          <div className="border-t pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-48" />
          </div>

          <div className="border-t pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Communication Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Channels</CardTitle>
            <CardDescription>Choose how you'd like to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base font-normal">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive booking confirmations and updates via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, emailEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications" className="text-base font-normal">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get text messages for important updates
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={preferences.smsEnabled}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, smsEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base font-normal">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, pushEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>Control what types of notifications you receive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="text-base font-normal">
                  Marketing & Promotions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Special offers and promotional content
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, marketingEmails: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Reminder Settings</CardTitle>
            <CardDescription>Configure when you receive trip reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reminder-frequency">Trip Reminder Frequency</Label>
              <Select
                value={preferences.reminderFrequency}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, reminderFrequency: value as any })
                }
              >
                <SelectTrigger id="reminder-frequency" className="w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reminders</SelectItem>
                  <SelectItem value="normal">Normal (24h and 1h before)</SelectItem>
                  <SelectItem value="extra">Extra (48h, 24h, and 1h before)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>
              Set times when you don't want to receive non-urgent notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHoursStart || ''}
                  onChange={(e) => 
                    setPreferences({ ...preferences, quietHoursStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHoursEnd || ''}
                  onChange={(e) => 
                    setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>Language Preference</CardTitle>
            <CardDescription>Choose your preferred language for notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">Notification Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, language: value })
                }
              >
                <SelectTrigger id="language" className="w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
};