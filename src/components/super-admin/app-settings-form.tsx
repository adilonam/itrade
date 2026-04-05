'use client';

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
import type { AppSettings } from '@/lib/prisma/generated/client';
import { cn } from '@/lib/utils';
import { IconCheck, IconPhoto, IconUpload } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

/** Inputs aligned with watch-trader / deposit flow (Match Trader shell). */
const tradeInputClassName =
  'h-auto min-h-[44px] rounded-lg border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2.5 text-sm text-[var(--trade-text)] shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)]/60 focus-visible:border-[var(--trade-accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--trade-accent-blue)]/25 focus-visible:ring-offset-0 dark:bg-[var(--trade-dark)]';

const tradeCardClassName =
  'rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm';

const tradePrimaryButtonClassName =
  'bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] hover:opacity-90';

const tradeOutlineButtonClassName =
  'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40';

const tradeCheckboxClassName =
  'size-4 shrink-0 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] accent-[var(--trade-accent-blue)]';

const tradeLabelClassName =
  'text-sm font-medium text-[var(--trade-text)]';

interface AppSettingsFormProps {
  initialSettings: AppSettings | null;
}

export function AppSettingsForm({ initialSettings }: AppSettingsFormProps) {
  const s = initialSettings;
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    s?.appIcon ?? null
  );
  const [iconLoading, setIconLoading] = useState(false);

  const [appName, setAppName] = useState(s?.appName ?? 'Trade Nova');
  const [openMarket, setOpenMarket] = useState(s?.openMarket ?? true);
  const [minMarginLevel, setMinMarginLevel] = useState(
    String(s?.minMarginLevel ?? 100)
  );
  const [googleClientId, setGoogleClientId] = useState(
    s?.googleClientId ?? ''
  );
  const [googleClientSecret, setGoogleClientSecret] = useState(
    s?.googleClientSecret ?? ''
  );
  const [twelveDataApiKeyPublic, setTwelveDataApiKeyPublic] = useState(
    s?.twelveDataApiKeyPublic ?? ''
  );
  const [twelveDataApiKey, setTwelveDataApiKey] = useState(
    s?.twelveDataApiKey ?? ''
  );
  const [smtpHost, setSmtpHost] = useState(s?.smtpHost ?? '');
  const [smtpPort, setSmtpPort] = useState(s?.smtpPort ?? '587');
  const [smtpSecure, setSmtpSecure] = useState(s?.smtpSecure ?? false);
  const [smtpUser, setSmtpUser] = useState(s?.smtpUser ?? '');
  const [smtpPassword, setSmtpPassword] = useState(s?.smtpPassword ?? '');
  const [smtpFromEmail, setSmtpFromEmail] = useState(s?.smtpFromEmail ?? '');
  const [alphaVantageApiKey, setAlphaVantageApiKey] = useState(
    s?.alphaVantageApiKey ?? ''
  );
  const [blobReadWriteToken, setBlobReadWriteToken] = useState(
    s?.blobReadWriteToken ?? ''
  );
  const [nowpaymentsApiKey, setNowpaymentsApiKey] = useState(
    s?.nowpaymentsApiKey ?? ''
  );
  const [nowpaymentsIpnSecret, setNowpaymentsIpnSecret] = useState(
    s?.nowpaymentsIpnSecret ?? ''
  );
  const [manualUsdtDepositWalletAddress, setManualUsdtDepositWalletAddress] =
    useState(s?.manualUsdtDepositWalletAddress ?? '');

  const [configLoading, setConfigLoading] = useState(false);

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

  const handleIconSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icon) return;
    setIconLoading(true);

    try {
      const formData = new FormData();
      formData.append('icon', icon);

      const response = await fetch('/api/super-admin/app-settings', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update icon');
      }

      toast.success('Icon updated');
      setIcon(null);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update icon'
      );
    } finally {
      setIconLoading(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = appName.trim();
    if (!trimmedName) {
      toast.error('App name is required');
      return;
    }
    const margin = parseInt(minMarginLevel, 10);
    if (Number.isNaN(margin) || margin <= 0) {
      toast.error('Min margin level must be a positive number');
      return;
    }

    setConfigLoading(true);
    try {
      const body = {
        appName: trimmedName,
        openMarket,
        minMarginLevel: margin,
        googleClientId: googleClientId.trim() || null,
        googleClientSecret: googleClientSecret.trim() || null,
        twelveDataApiKeyPublic: twelveDataApiKeyPublic.trim() || null,
        twelveDataApiKey: twelveDataApiKey.trim() || null,
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort.trim() || '587',
        smtpSecure,
        smtpUser: smtpUser.trim() || null,
        smtpPassword: smtpPassword.trim() || null,
        smtpFromEmail: smtpFromEmail.trim() || null,
        alphaVantageApiKey: alphaVantageApiKey.trim() || null,
        blobReadWriteToken: blobReadWriteToken.trim() || null,
        nowpaymentsApiKey: nowpaymentsApiKey.trim() || null,
        nowpaymentsIpnSecret: nowpaymentsIpnSecret.trim() || null,
        manualUsdtDepositWalletAddress:
          manualUsdtDepositWalletAddress.trim() || null
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
      <form onSubmit={handleIconSubmit}>
        <Card className={tradeCardClassName}>
          <CardHeader>
            <CardTitle className='text-sm font-semibold text-[var(--trade-text)]'>
              Application icon
            </CardTitle>
            <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
              Upload the application icon shown in the dashboard sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='icon' className={tradeLabelClassName}>
                Icon file
              </Label>
              <div className='flex items-start gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='icon'
                      type='file'
                      accept='image/*'
                      onChange={handleIconChange}
                      className={cn(tradeInputClassName, 'cursor-pointer')}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      className={tradeOutlineButtonClassName}
                      onClick={() => document.getElementById('icon')?.click()}
                    >
                      <IconUpload className='h-4 w-4' />
                    </Button>
                  </div>
                  <p className='mt-1 text-xs text-[var(--trade-text-muted)]'>
                    PNG, JPG or SVG. Max 2MB. Recommended: 512×512px
                  </p>
                </div>

                {iconPreview && (
                  <div className='relative h-24 w-24 overflow-hidden rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]'>
                    <Image
                      src={iconPreview}
                      alt='App icon preview'
                      fill
                      className='object-cover'
                    />
                  </div>
                )}

                {!iconPreview && (
                  <div className='flex h-24 w-24 items-center justify-center rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]'>
                    <IconPhoto className='h-8 w-8 text-[var(--trade-text-muted)]' />
                  </div>
                )}
              </div>
            </div>

            <Button
              type='submit'
              disabled={iconLoading || !icon}
              className={tradePrimaryButtonClassName}
            >
              {iconLoading ? 'Saving…' : 'Save icon'}
            </Button>
          </CardContent>
        </Card>
      </form>

      <form onSubmit={handleConfigSubmit}>
        <Card className={tradeCardClassName}>
          <CardHeader>
            <CardTitle className='text-sm font-semibold text-[var(--trade-text)]'>
              Application configuration
            </CardTitle>
            <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
              Names, integrations, and trading limits. Public values are exposed
              via{' '}
              <code className='rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--trade-text)]'>
                GET /api/app-settings?label=…
              </code>{' '}
              where documented.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='appName' className={tradeLabelClassName}>
                  App name
                </Label>
                <Input
                  id='appName'
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                  className={tradeInputClassName}
                />
              </div>
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
              <div className='space-y-2'>
                <Label htmlFor='minMargin' className={tradeLabelClassName}>
                  Min margin level (%)
                </Label>
                <Input
                  id='minMargin'
                  type='number'
                  min={1}
                  value={minMarginLevel}
                  onChange={(e) => setMinMarginLevel(e.target.value)}
                  className={tradeInputClassName}
                />
              </div>
            </div>

            <div className='border-t border-[var(--trade-border)] pt-6'>
              <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                Google sign-in
              </h3>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='gId' className={tradeLabelClassName}>
                    Client ID
                  </Label>
                  <Input
                    id='gId'
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='gSec' className={tradeLabelClassName}>
                    Client secret
                  </Label>
                  <Input
                    id='gSec'
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
              </div>
            </div>

            <div className='border-t border-[var(--trade-border)] pt-6'>
              <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                Twelve Data
              </h3>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='tdPub' className={tradeLabelClassName}>
                    Public API key (browser / WebSocket)
                  </Label>
                  <Input
                    id='tdPub'
                    value={twelveDataApiKeyPublic}
                    onChange={(e) => setTwelveDataApiKeyPublic(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='tdSrv' className={tradeLabelClassName}>
                    Server API key
                  </Label>
                  <Input
                    id='tdSrv'
                    value={twelveDataApiKey}
                    onChange={(e) => setTwelveDataApiKey(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
              </div>
            </div>

            <div className='border-t border-[var(--trade-border)] pt-6'>
              <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                SMTP (email)
              </h3>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='smtpHost' className={tradeLabelClassName}>
                    Host
                  </Label>
                  <Input
                    id='smtpHost'
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='smtpPort' className={tradeLabelClassName}>
                    Port
                  </Label>
                  <Input
                    id='smtpPort'
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className={tradeInputClassName}
                  />
                </div>
                <div className='flex items-center gap-2 sm:col-span-2'>
                  <input
                    id='smtpSecure'
                    type='checkbox'
                    className={tradeCheckboxClassName}
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                  />
                  <Label
                    htmlFor='smtpSecure'
                    className={cn(tradeLabelClassName, 'font-normal')}
                  >
                    TLS / secure
                  </Label>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='smtpUser' className={tradeLabelClassName}>
                    User
                  </Label>
                  <Input
                    id='smtpUser'
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='smtpPass' className={tradeLabelClassName}>
                    Password
                  </Label>
                  <Input
                    id='smtpPass'
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='smtpFrom' className={tradeLabelClassName}>
                    From email
                  </Label>
                  <Input
                    id='smtpFrom'
                    type='email'
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    className={tradeInputClassName}
                  />
                </div>
              </div>
            </div>

            <div className='border-t border-[var(--trade-border)] pt-6'>
              <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                Other integrations
              </h3>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='av' className={tradeLabelClassName}>
                    Alpha Vantage API key
                  </Label>
                  <Input
                    id='av'
                    value={alphaVantageApiKey}
                    onChange={(e) => setAlphaVantageApiKey(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='blob' className={tradeLabelClassName}>
                    Vercel Blob read/write token
                  </Label>
                  <Input
                    id='blob'
                    value={blobReadWriteToken}
                    onChange={(e) => setBlobReadWriteToken(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='npKey' className={tradeLabelClassName}>
                    NOWPayments API key
                  </Label>
                  <Input
                    id='npKey'
                    value={nowpaymentsApiKey}
                    onChange={(e) => setNowpaymentsApiKey(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='npIpn' className={tradeLabelClassName}>
                    NOWPayments IPN secret
                  </Label>
                  <Input
                    id='npIpn'
                    value={nowpaymentsIpnSecret}
                    onChange={(e) => setNowpaymentsIpnSecret(e.target.value)}
                    autoComplete='off'
                    className={tradeInputClassName}
                  />
                </div>
                <div className='space-y-2 sm:col-span-2'>
                  <Label htmlFor='manualWallet' className={tradeLabelClassName}>
                    Manual USDT deposit wallet
                  </Label>
                  <Input
                    id='manualWallet'
                    value={manualUsdtDepositWalletAddress}
                    onChange={(e) =>
                      setManualUsdtDepositWalletAddress(e.target.value)
                    }
                    className={tradeInputClassName}
                  />
                </div>
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
