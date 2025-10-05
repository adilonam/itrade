'use client';

import { useState, useEffect } from 'react';
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
  TransactionType,
  TransactionStatus,
  Transaction,
  Market,
  User
} from '@prisma/client';

// Extended transaction type with relations
type TransactionWithRelations = Transaction & {
  user: User | null;
  market: Market | null;
};

// Create transaction data type
type CreateTransactionData = Transaction;

// Update transaction data type
type UpdateTransactionData = Partial<Transaction>;

interface TransactionFormProps {
  transaction?: TransactionWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionForm({
  transaction,
  onClose,
  onSuccess
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    userId: '',
    type: '' as TransactionType | '',
    status: 'PLACED' as TransactionStatus,
    marketId: '',
    quantity: '',
    description: '',
    executedAt: '',
    pnl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data
  useEffect(() => {
    if (transaction) {
      setFormData({
        userId: transaction.userId,
        type: transaction.type,
        status: transaction.status,
        marketId: transaction.marketId || '',
        quantity: transaction.quantity?.toString() || '',
        description: transaction.description || '',
        executedAt: transaction.executedAt
          ? new Date(transaction.executedAt).toISOString().slice(0, 16)
          : '',
        pnl: transaction.pnl?.toString() || ''
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.userId || !formData.type || !formData.quantity) {
        throw new Error('User ID, type, and quantity are required');
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      const data = {
        userId: formData.userId,
        type: formData.type as TransactionType,
        status: formData.status as TransactionStatus,
        marketId: formData.marketId || undefined,
        quantity: quantity,
        description: formData.description || undefined,
        executedAt: formData.executedAt
          ? new Date(formData.executedAt)
          : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined
      };

      const url = transaction
        ? `/api/admin/transactions/${transaction.id}`
        : '/api/admin/transactions';

      const method = transaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transaction');
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save transaction'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Create New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? 'Update the transaction details below.'
              : 'Fill in the details to create a new transaction.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* User ID */}
            <div className='space-y-2'>
              <Label htmlFor='userId'>User ID *</Label>
              <Input
                id='userId'
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                placeholder='Enter user ID'
                required
              />
            </div>

            {/* Type */}
            <div className='space-y-2'>
              <Label htmlFor='type'>Transaction Type *</Label>
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
                  <SelectItem value='DEPOSIT'>Deposit</SelectItem>
                  <SelectItem value='WITHDRAWAL'>Withdrawal</SelectItem>
                  <SelectItem value='TRANSFER_IN'>Transfer In</SelectItem>
                  <SelectItem value='TRANSFER_OUT'>Transfer Out</SelectItem>
                  <SelectItem value='FEE'>Fee</SelectItem>
                  <SelectItem value='BONUS'>Bonus</SelectItem>
                  <SelectItem value='REFUND'>Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PLACED'>Placed</SelectItem>
                  <SelectItem value='CLOSED'>Closed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='PROCESSING'>Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Market ID */}
            <div className='space-y-2'>
              <Label htmlFor='marketId'>Market ID</Label>
              <Input
                id='marketId'
                value={formData.marketId}
                onChange={(e) => handleInputChange('marketId', e.target.value)}
                placeholder='Enter market ID (optional)'
              />
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
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Transaction description (optional)'
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : transaction ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
