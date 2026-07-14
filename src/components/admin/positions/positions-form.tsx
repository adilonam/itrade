'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  PositionType,
  PositionStatus,
  Position,
  Market,
  User,
  Room
} from '@/lib/prisma/generated/client';

type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

interface PositionFormProps {
  position?: PositionWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
  /** Hide REAL balance preview (client-positions admin page) */
  hideBalanceInfo?: boolean;
}

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
};

/** `datetime-local` expects local calendar time without a timezone suffix. */
function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PositionForm({
  position,
  onClose,
  onSuccess,
  hideBalanceInfo = false
}: PositionFormProps) {
  const [formData, setFormData] = useState(() => ({
    userId: '',
    type: '' as PositionType | '',
    status: 'PLACED' as PositionStatus,
    room: 'TRADING' as Room,
    marketId: '',
    quantity: '',
    executedPrice: '',
    closedPrice: '',
    takeProfit: '',
    stopLoss: '',
    description: '',
    executedAt: position ? '' : formatDatetimeLocal(new Date()),
    closedAt: '' as string,
    pnl: ''
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userEmailQuery, setUserEmailQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
  const [userCandidates, setUserCandidates] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [marketSymbolQuery, setMarketSymbolQuery] = useState('');
  const [debouncedMarketSymbol, setDebouncedMarketSymbol] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userEmailQuery), 400);
    return () => clearTimeout(t);
  }, [userEmailQuery]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedMarketSymbol(marketSymbolQuery),
      400
    );
    return () => clearTimeout(t);
  }, [marketSymbolQuery]);

  const loadUserBalances = useCallback(async (userId: string) => {
    setLoadingBalances(true);
    setRealBalance(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const u = data.user as {
        realBalance?: number;
      };
      setRealBalance(u.realBalance ?? 0);
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  useEffect(() => {
    if (position) {
      setFormData({
        userId: position.userId,
        type: position.type,
        status: position.status,
        room: position.room,
        marketId: position.marketId || '',
        quantity: position.quantity?.toString() || '',
        executedPrice:
          position.executedPrice != null
            ? String(position.executedPrice)
            : '',
        closedPrice:
          position.closedPrice != null ? String(position.closedPrice) : '',
        takeProfit:
          position.takeProfit != null ? String(position.takeProfit) : '',
        stopLoss: position.stopLoss != null ? String(position.stopLoss) : '',
        description: position.description || '',
        executedAt: position.executedAt
          ? formatDatetimeLocal(new Date(position.executedAt))
          : '',
        closedAt:
          position.status === 'CLOSED' && position.closedAt
            ? formatDatetimeLocal(new Date(position.closedAt))
            : position.status === 'CLOSED'
              ? formatDatetimeLocal(new Date())
              : '',
        pnl: position.pnl?.toString() || ''
      });
      setUserEmailQuery(position.user?.email ?? '');
      if (!hideBalanceInfo) {
        void loadUserBalances(position.userId);
      }
    }
  }, [position, loadUserBalances, hideBalanceInfo]);

  useEffect(() => {
    if (position) return;
    if (debouncedUserQuery.trim().length < 2) {
      setUserCandidates([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          limit: '30',
          page: '1',
          search: debouncedUserQuery.trim()
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setUserCandidates((data.users ?? []) as AdminUserRow[]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedUserQuery, position]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMarkets(true);
      try {
        const params = new URLSearchParams({
          limit: '100',
          page: '1',
          room: formData.room
        });
        const sym = debouncedMarketSymbol.trim();
        if (sym) params.set('symbol', sym);
        const res = await fetch(`/api/admin/markets?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        let list = (data.markets ?? []) as Market[];
        if (
          position?.market &&
          !list.some((m) => m.id === position.market!.id)
        ) {
          list = [position.market, ...list];
        }
        setMarkets(list);
      } finally {
        if (!cancelled) setLoadingMarkets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.room, debouncedMarketSymbol, position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.userId || !formData.type || !formData.quantity) {
        throw new Error('User, type, and quantity are required');
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      if (!formData.marketId) {
        throw new Error('Market is required');
      }

      const executedPrice = parseFloat(formData.executedPrice);
      if (isNaN(executedPrice)) {
        throw new Error('Executed price is required');
      }

      const parseTpSl = (raw: string, label: string): number | null => {
        const t = raw.trim();
        if (t === '') return null;
        const n = parseFloat(t);
        if (isNaN(n)) {
          throw new Error(`${label} must be a valid number`);
        }
        return n;
      };

      const takeProfit = parseTpSl(formData.takeProfit, 'Take profit');
      const stopLoss = parseTpSl(formData.stopLoss, 'Stop loss');
      const closedPrice = parseTpSl(formData.closedPrice, 'Closed price');

      const data: Record<string, unknown> = {
        userId: formData.userId,
        type: formData.type as PositionType,
        status: formData.status as PositionStatus,
        room: formData.room as Room,
        marketId: formData.marketId,
        quantity,
        executedPrice,
        closedPrice,
        takeProfit,
        stopLoss,
        description: formData.description || undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined
      };
      if (formData.executedAt) {
        data.executedAt = new Date(formData.executedAt);
      }

      if (formData.status === 'CLOSED') {
        const raw = formData.closedAt.trim();
        const parsed = raw ? new Date(raw) : new Date();
        if (Number.isNaN(parsed.getTime())) {
          throw new Error('Closed at must be a valid date and time');
        }
        data.closedAt = parsed;
      } else {
        data.closedAt = null;
      }

      const url = position
        ? `/api/admin/positions/${position.id}`
        : '/api/admin/positions';

      const method = position ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save position');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save position');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectUser = (u: AdminUserRow) => {
    setFormData((prev) => ({ ...prev, userId: u.id }));
    setUserEmailQuery(u.email);
    setUserCandidates([]);
    void loadUserBalances(u.id);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto text-sm text-[var(--trade-text)]'>
        <DialogHeader>
          <DialogTitle>
            {position ? 'Edit Position' : 'Create New Position'}
          </DialogTitle>
          <DialogDescription>
            {position
              ? 'Update the position details below.'
              : 'Fill in the details to create a new position.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Room — drives which markets are listed */}
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='room'>Position room *</Label>
              <Select
                value={formData.room}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    room: value as Room,
                    marketId: '',
                    ...(!position ? { executedPrice: '' } : {})
                  }));
                }}
              >
                <SelectTrigger id='room'>
                  <SelectValue placeholder='Select room' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='STOCK'>Stock</SelectItem>
                  <SelectItem value='TRADING'>Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User by email */}
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='userEmail'>User (filter by email) *</Label>
              <Input
                id='userEmail'
                value={userEmailQuery}
                onChange={(e) => {
                  setUserEmailQuery(e.target.value);
                  if (position) return;
                  setFormData((prev) => ({ ...prev, userId: '' }));
                  setRealBalance(null);
                }}
                placeholder='Type email to search'
                autoComplete='off'
                required={!position}
                disabled={!!position}
              />
              {!position && userCandidates.length > 0 && (
                <ul
                  className='bg-popover text-popover-foreground max-h-40 overflow-auto rounded-md border p-1 text-sm shadow-md'
                  role='listbox'
                >
                  {userCandidates.map((u) => (
                    <li key={u.id}>
                      <button
                        type='button'
                        className='hover:bg-accent focus:bg-accent w-full rounded px-2 py-1.5 text-left'
                        onClick={() => selectUser(u)}
                      >
                        <span className='font-medium'>{u.email}</span>
                        {u.name ? (
                          <span className='text-muted-foreground ml-2'>
                            {u.name}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {loadingUsers && (
                <p className='text-muted-foreground text-xs'>Searching…</p>
              )}
              {formData.userId && (
                <p className='text-muted-foreground text-xs'>
                  Selected user ID: {formData.userId}
                </p>
              )}
            </div>

            {realBalance !== null && !hideBalanceInfo && (
              <div className='bg-muted/40 md:col-span-2 grid grid-cols-1 gap-3 rounded-lg border p-3'>
                <div>
                  <p className='text-muted-foreground text-xs'>
                    REAL balance (margin)
                  </p>
                  <p className='text-lg font-semibold tabular-nums'>
                    {loadingBalances
                      ? '…'
                      : (realBalance ?? 0).toLocaleString(undefined, {
                          maximumFractionDigits: 2
                        })}
                  </p>
                </div>
              </div>
            )}

            {/* Type */}
            <div className='space-y-2'>
              <Label htmlFor='type'>Position Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='BUY'>Buy</SelectItem>
                  <SelectItem value='SELL'>Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  const next = value as PositionStatus;
                  setFormData((prev) => ({
                    ...prev,
                    status: next,
                    closedAt:
                      next === 'CLOSED'
                        ? prev.closedAt.trim()
                          ? prev.closedAt
                          : formatDatetimeLocal(new Date())
                        : ''
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PLACED'>Placed</SelectItem>
                  <SelectItem value='CLOSED'>Closed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='PENDING'>Processing</SelectItem>
                  <SelectItem value='SPLITTED'>Splitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Market — filtered by room + symbol */}
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='marketSymbol'>Market symbol filter</Label>
              <Input
                id='marketSymbol'
                value={marketSymbolQuery}
                onChange={(e) => setMarketSymbolQuery(e.target.value)}
                placeholder='Filter markets by symbol (optional)'
                autoComplete='off'
              />
              <Label htmlFor='marketId' className='pt-1'>
                Market * ({formData.room})
              </Label>
              <Select
                value={formData.marketId}
                onValueChange={(value) => {
                  setFormData((prev) => {
                    const selected = markets.find((m) => m.id === value);
                    const last =
                      selected != null &&
                      typeof selected.lastPrice === 'number' &&
                      Number.isFinite(selected.lastPrice)
                        ? String(selected.lastPrice)
                        : '';
                    return {
                      ...prev,
                      marketId: value,
                      ...(!position && last !== ''
                        ? { executedPrice: last }
                        : {})
                    };
                  });
                }}
              >
                <SelectTrigger id='marketId'>
                  <SelectValue
                    placeholder={
                      loadingMarkets
                        ? 'Loading markets…'
                        : 'Select a market for this room'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.symbol} — {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {markets.length === 0 && !loadingMarkets && (
                <p className='text-muted-foreground text-xs'>
                  No markets for this room
                  {debouncedMarketSymbol.trim()
                    ? ` matching “${debouncedMarketSymbol.trim()}”`
                    : ''}
                  . Try another symbol or add markets in admin.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className='space-y-2'>
              <Label htmlFor='quantity'>Quantity *</Label>
              <Input
                id='quantity'
                type='number'
                step='0.0001'
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder='0.0000'
                required
              />
            </div>

            {/* Executed price */}
            <div className='space-y-2'>
              <Label htmlFor='executedPrice'>Executed price *</Label>
              <Input
                id='executedPrice'
                type='number'
                step='0.0001'
                value={formData.executedPrice}
                onChange={(e) =>
                  handleInputChange('executedPrice', e.target.value)
                }
                placeholder='0.0000'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='takeProfit'>Take profit (optional)</Label>
              <Input
                id='takeProfit'
                type='number'
                step='0.0001'
                value={formData.takeProfit}
                onChange={(e) =>
                  handleInputChange('takeProfit', e.target.value)
                }
                placeholder='Price level'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='stopLoss'>Stop loss (optional)</Label>
              <Input
                id='stopLoss'
                type='number'
                step='0.0001'
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                placeholder='Price level'
              />
            </div>

            {/* Closed price */}
            <div className='space-y-2'>
              <Label htmlFor='closedPrice'>Closed price (optional)</Label>
              <Input
                id='closedPrice'
                type='number'
                step='0.0001'
                value={formData.closedPrice}
                onChange={(e) =>
                  handleInputChange('closedPrice', e.target.value)
                }
                placeholder='0.0000'
              />
            </div>

            {/* P&L */}
            <div className='space-y-2'>
              <Label htmlFor='pnl'>P&L</Label>
              <Input
                id='pnl'
                type='number'
                step='0.01'
                value={formData.pnl}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                placeholder='0.00'
              />
            </div>

            {/* Executed At */}
            <div className='space-y-2'>
              <Label htmlFor='executedAt'>Executed At</Label>
              <Input
                id='executedAt'
                type='datetime-local'
                value={formData.executedAt}
                onChange={(e) =>
                  handleInputChange('executedAt', e.target.value)
                }
              />
            </div>

            {formData.status === 'CLOSED' ? (
              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='closedAt'>Closed at *</Label>
                <Input
                  id='closedAt'
                  type='datetime-local'
                  value={formData.closedAt}
                  onChange={(e) =>
                    handleInputChange('closedAt', e.target.value)
                  }
                />
                <p className='text-muted-foreground text-xs'>
                  Defaults to the current date and time when you set status to
                  Closed.
                </p>
              </div>
            ) : null}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Position description (optional)'
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : position ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
