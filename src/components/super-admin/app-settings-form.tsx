'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { AppSettings } from '@/lib/prisma/generated/client';
import { cn } from '@/lib/utils';
import { IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const tradeCardClassName =
  'rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm';

const tradePrimaryButtonClassName =
  'bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] hover:opacity-90';

const tradeCheckboxClassName =
  'size-4 shrink-0 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] accent-[var(--trade-accent-blue)]';

const tradeLabelClassName =
  'text-sm font-medium text-[var(--trade-text)]';

interface AppSettingsFormProps {
  initialSettings: AppSettings | null;
}

export function AppSettingsForm({ initialSettings }: AppSettingsFormProps) {
  const s = initialSettings;
  const [openMarket, setOpenMarket] = useState(s?.openMarket ?? true);

  const [configLoading, setConfigLoading] = useState(false);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setConfigLoading(true);
    try {
      const body = {
        openMarket
      };

      const response = await fetch('/api/super-admin/app-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      toast.success('Configuration saved');
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div className='space-y-8'>
      <form onSubmit={handleConfigSubmit}>
        <Card className={tradeCardClassName}>
          <CardHeader>
            <CardTitle className='text-sm font-semibold text-[var(--trade-text)]'>
              Application configuration
            </CardTitle>
            <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
              Core platform settings. Public values are exposed
              via{' '}
              <code className='rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--trade-text)]'>
                GET /api/app-settings?label=…
              </code>{' '}
              where documented.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='flex items-center gap-2'>
                <input
                  id='openMarket'
                  type='checkbox'
                  className={tradeCheckboxClassName}
                  checked={openMarket}
                  onChange={(e) => setOpenMarket(e.target.checked)}
                />
                <Label
                  htmlFor='openMarket'
                  className={cn(tradeLabelClassName, 'font-normal')}
                >
                  Open market (users may trade)
                </Label>
              </div>
            </div>

            <Button
              type='submit'
              disabled={configLoading}
              className={tradePrimaryButtonClassName}
            >
              {configLoading ? (
                'Saving…'
              ) : (
                <>
                  <IconCheck className='mr-2 h-4 w-4' />
                  Save configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
