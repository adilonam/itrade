'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';
import { IconLoader2, IconX } from '@tabler/icons-react';

type LinkedUser = {
  id: string;
  name: string | null;
  email: string;
  balance?: number;
};

type InvestmentOption = {
  id: string;
  title: string;
  duration: number;
  rentability: number;
  minInvestment: number;
  maxInvestment: number | null;
  riskLevel: string;
};

interface SellerInvestmentCreationProps {
  onInvestmentCreated: () => void;
  onCancel: () => void;
}

export function SellerInvestmentCreation({
  onInvestmentCreated,
  onCancel
}: SellerInvestmentCreationProps) {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [investments, setInvestments] = useState<InvestmentOption[]>([]);
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [investmentFilter, setInvestmentFilter] = useState('');
  const [debouncedUserFilter, setDebouncedUserFilter] = useState('');
  const [, setDebouncedInvestmentFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserFilter(userEmailFilter), 400);
    return () => clearTimeout(t);
  }, [userEmailFilter]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedInvestmentFilter(investmentFilter),
      400
    );
    return () => clearTimeout(t);
  }, [investmentFilter]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const params = new URLSearchParams({ limit: '100' });
        if (debouncedUserFilter.trim())
          params.set('search', debouncedUserFilter.trim());
        const res = await fetch(`/api/seller/users?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [debouncedUserFilter]);

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        setLoadingInvestments(true);
        const res = await fetch('/api/investments');
        if (!res.ok) throw new Error('Failed to fetch investments');
        const data = await res.json();
        setInvestments(data.investments ?? []);
      } catch {
        toast.error('Failed to load investments');
      } finally {
        setLoadingInvestments(false);
      }
    };
    loadInvestments();
  }, []);

  const selectedInvestment = investments.find(
    (i) => i.id === selectedInvestmentId
  );
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredInvestments = investmentFilter.trim()
    ? investments.filter((i) =>
        i.title.toLowerCase().includes(investmentFilter.toLowerCase())
      )
    : investments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedInvestmentId || !amount.trim()) {
      toast.error('Please select user, investment, and amount');
      return;
    }
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (
      selectedInvestment &&
      (numAmount < selectedInvestment.minInvestment ||
        (selectedInvestment.maxInvestment != null &&
          numAmount > selectedInvestment.maxInvestment))
    ) {
      toast.error(
        `Amount must be between ${selectedInvestment.minInvestment} and ${selectedInvestment.maxInvestment ?? '∞'}`
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          investmentId: selectedInvestmentId,
          amount: numAmount,
          autoReinvest
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to create investment');
      }
      toast.success('Investment created');
      onInvestmentCreated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create investment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='border-2'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Create New Investment</CardTitle>
            <CardDescription>
              Create an investment for a linked user. Select user, investment,
              and amount.
            </CardDescription>
          </div>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <IconX className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          {/* User: filter + select on one line */}
          <div className='flex flex-wrap items-end gap-2'>
            <div className='space-y-2'>
              <Label htmlFor='user-filter'>Search by email</Label>
              <Input
                id='user-filter'
                type='text'
                placeholder='Filter by email...'
                value={userEmailFilter}
                onChange={(e) => setUserEmailFilter(e.target.value)}
                className='h-9 w-48'
              />
            </div>
            <div className='min-w-[200px] flex-1 space-y-2'>
              <Label htmlFor='user-select'>Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers}
              >
                <SelectTrigger id='user-select'>
                  <SelectValue placeholder='Select a user' />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <SelectItem value='_' disabled>
                      Loading users...
                    </SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value='_' disabled>
                      No users found
                    </SelectItem>
                  ) : (
                    users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} ({u.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedUser && selectedUser.balance != null && (
            <p className='text-muted-foreground text-xs'>
              Balance: €{selectedUser.balance.toFixed(2)}
            </p>
          )}

          {/* Investment: filter + select on one line */}
          <div className='flex flex-wrap items-end gap-2'>
            <div className='space-y-2'>
              <Label htmlFor='investment-filter'>Search by title</Label>
              <Input
                id='investment-filter'
                type='text'
                placeholder='Filter...'
                value={investmentFilter}
                onChange={(e) => setInvestmentFilter(e.target.value)}
                className='h-9 w-48'
              />
            </div>
            <div className='min-w-[200px] flex-1 space-y-2'>
              <Label htmlFor='investment-select'>Select Investment</Label>
              <Select
                value={selectedInvestmentId}
                onValueChange={setSelectedInvestmentId}
                disabled={loadingInvestments}
              >
                <SelectTrigger id='investment-select'>
                  <SelectValue placeholder='Select an investment' />
                </SelectTrigger>
                <SelectContent>
                  {loadingInvestments ? (
                    <SelectItem value='_' disabled>
                      Loading investments...
                    </SelectItem>
                  ) : filteredInvestments.length === 0 ? (
                    <SelectItem value='_' disabled>
                      No investments found
                    </SelectItem>
                  ) : (
                    filteredInvestments.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title} ({i.duration} d, {i.rentability}%)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedInvestment && (
            <p className='text-muted-foreground text-xs'>
              Min: €{selectedInvestment.minInvestment.toFixed(2)}
              {selectedInvestment.maxInvestment != null &&
                ` · Max: €${selectedInvestment.maxInvestment.toFixed(2)}`}
            </p>
          )}

          {/* Amount */}
          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount (€)</Label>
            <Input
              id='amount'
              type='number'
              placeholder='Enter amount'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={selectedInvestment?.minInvestment ?? 0}
              max={selectedInvestment?.maxInvestment ?? undefined}
              step='0.01'
              className='w-full max-w-xs'
            />
          </div>

          {/* Auto reinvest */}
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='auto-reinvest'
              checked={autoReinvest}
              onChange={(e) => setAutoReinvest(e.target.checked)}
              className='border-input h-4 w-4 rounded'
            />
            <Label htmlFor='auto-reinvest' className='font-normal'>
              Auto-reinvest when completed
            </Label>
          </div>

          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Investment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
