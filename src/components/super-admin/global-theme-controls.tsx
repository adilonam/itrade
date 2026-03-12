'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/active-theme';

interface GlobalThemeSettings {
  themeMode: string;
  themeColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
}

export function GlobalThemeControls() {
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const { setActiveTheme } = useThemeConfig();
  const [settings, setSettings] = useState<GlobalThemeSettings>({
    themeMode: 'system',
    themeColor: 'match-trader',
    reducedMotion: false,
    highContrast: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load current global theme settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/super-admin/global-theme-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load global theme settings:', error);
        toast.error('Failed to load theme settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'SUPERADMIN') {
      loadSettings();
    }
  }, [session]);

  const handleSave = async () => {
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      toast.error('Unauthorized');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/super-admin/global-theme-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);

        // Apply the theme changes immediately
        setTheme(settings.themeMode);
        setActiveTheme(settings.themeColor);

        toast.success('Global theme settings saved successfully');
      } else {
        toast.error('Failed to save theme settings');
      }
    } catch (error) {
      console.error('Failed to save global theme settings:', error);
      toast.error('Failed to save theme settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeColorChange = (color: string) => {
    setSettings((prev) => ({ ...prev, themeColor: color }));
    // Apply immediately for preview
    setActiveTheme(color);
  };

  const handleThemeModeChange = (mode: string) => {
    setSettings((prev) => ({ ...prev, themeMode: mode }));
    // Apply immediately for preview
    setTheme(mode);
  };

  if (session?.user?.role !== 'SUPERADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Theme Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Theme Settings</CardTitle>
        <CardDescription>
          Configure the global theme settings that apply to all users. Changes
          will be visible to all users after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Theme Mode */}
        <div className='space-y-2'>
          <Label>Theme Mode</Label>
          <div className='flex gap-2'>
            {['light', 'dark', 'system'].map((mode) => (
              <Button
                key={mode}
                variant={settings.themeMode === mode ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleThemeModeChange(mode)}
                className='capitalize'
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Theme Color */}
        <div className='space-y-2'>
          <Label>Theme Color</Label>
          <div className='flex flex-wrap gap-2'>
            {[
              'default',
              'blue',
              'green',
              'amber',
              'match-trader',
              'default-scaled',
              'blue-scaled',
              'mono-scaled'
            ].map((color) => (
              <Button
                key={color}
                variant={settings.themeColor === color ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleThemeColorChange(color)}
                className='capitalize'
              >
                {color === 'match-trader' ? 'Match Trader' : color.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Accessibility Options */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Reduced Motion</Label>
              <p className='text-muted-foreground text-sm'>
                Reduce animations and transitions for better accessibility
              </p>
            </div>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, reducedMotion: checked }))
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>High Contrast</Label>
              <p className='text-muted-foreground text-sm'>
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, highContrast: checked }))
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <div className='flex justify-end pt-4'>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Global Theme Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
