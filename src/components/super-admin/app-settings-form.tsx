'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconUpload, IconPhoto, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface AppSettingsFormProps {
  initialIcon?: string | null;
  initialName?: string;
}

export function AppSettingsForm({
  initialIcon,
  initialName = 'Trading Dashboard'
}: AppSettingsFormProps) {
  const [appName, setAppName] = useState(initialName);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    initialIcon || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Icon size must be less than 2MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('appName', appName);
      if (icon) {
        formData.append('icon', icon);
      }

      const response = await fetch('/api/super-admin/app-settings', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      toast.success('App settings updated successfully');
      setIcon(null);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update settings'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Manage your application&apos;s branding and visual identity
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='appName'>Application Name</Label>
            <Input
              id='appName'
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder='Trading Dashboard'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='icon'>Application Icon</Label>
            <div className='flex items-start gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <Input
                    id='icon'
                    type='file'
                    accept='image/*'
                    onChange={handleIconChange}
                    className='cursor-pointer'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => document.getElementById('icon')?.click()}
                  >
                    <IconUpload className='h-4 w-4' />
                  </Button>
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  PNG, JPG or SVG. Max 2MB. Recommended: 512x512px
                </p>
              </div>

              {iconPreview && (
                <div className='bg-muted relative h-24 w-24 overflow-hidden rounded-lg border'>
                  <Image
                    src={iconPreview}
                    alt='App icon preview'
                    fill
                    className='object-cover'
                  />
                </div>
              )}

              {!iconPreview && (
                <div className='bg-muted flex h-24 w-24 items-center justify-center rounded-lg border'>
                  <IconPhoto className='text-muted-foreground h-8 w-8' />
                </div>
              )}
            </div>
          </div>

          <Button type='submit' disabled={isLoading}>
            {isLoading ? (
              <>
                <span className='mr-2'>Saving...</span>
              </>
            ) : (
              <>
                <IconCheck className='mr-2 h-4 w-4' />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
