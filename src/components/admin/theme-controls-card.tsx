'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ThemeSelector } from '@/components/theme-selector';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

export function ThemeControlsCard() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Configuration</CardTitle>
        <CardDescription>
          Customize colors, appearance, and visual preferences for the
          application
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Dark/Light Mode Toggle */}
        <div className='space-y-2'>
          <Label className='text-base font-semibold'>Color Mode</Label>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <div className='text-sm font-medium'>
                Current Mode: {currentTheme === 'dark' ? 'Dark' : 'Light'}
              </div>
              <div className='text-muted-foreground text-xs'>
                Toggle between light and dark color schemes
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>

        <Separator />

        {/* Theme Selector */}
        <div className='space-y-2'>
          <Label className='text-base font-semibold'>Color Theme</Label>
          <div className='rounded-lg border p-4'>
            <div className='mb-3 space-y-0.5'>
              <div className='text-sm font-medium'>Theme Palette</div>
              <div className='text-muted-foreground text-xs'>
                Select a color theme for the application
              </div>
            </div>
            <ThemeSelector />
          </div>
        </div>

        <Separator />

        {/* Additional Theme Settings */}
        <div className='space-y-4'>
          <Label className='text-base font-semibold'>Additional Settings</Label>

          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <div className='text-sm font-medium'>Reduced Motion</div>
              <div className='text-muted-foreground text-xs'>
                Minimize animations and transitions
              </div>
            </div>
            <Switch />
          </div>

          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <div className='text-sm font-medium'>High Contrast</div>
              <div className='text-muted-foreground text-xs'>
                Increase contrast for better visibility
              </div>
            </div>
            <Switch />
          </div>
        </div>

        <Separator />

        {/* Theme Information */}
        <div className='bg-muted rounded-lg p-4'>
          <div className='mb-2 text-sm font-medium'>About Themes</div>
          <ul className='text-muted-foreground space-y-1 text-xs'>
            <li>
              • <strong>Default Themes:</strong> Standard color palettes for
              everyday use
            </li>
            <li>
              • <strong>Scaled Themes:</strong> Enhanced contrast with refined
              typography
            </li>
            <li>
              • <strong>Monospaced:</strong> Developer-focused theme with
              monospaced fonts
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
