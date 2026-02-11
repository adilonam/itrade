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
  PositionType,
  PositionStatus,
  Position,
  Market,
  User
} from '@/lib/prisma/generated/client';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

// Create position data type
type CreatePositionData = Position;

// Update position data type
type UpdatePositionData = Partial<Position>;

interface PositionFormProps {
  position?: PositionWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PositionForm({
  position,
  onClose,
  onSuccess
}: PositionFormProps) {
  const [formData, setFormData] = useState({
    userId: '',
    type: '' as PositionType | '',
    status: 'PLACED' as PositionStatus,
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
    if (position) {
      setFormData({
        userId: position.userId,
        type: position.type,
        status: position.status,
        marketId: position.marketId || '',
        quantity: position.quantity?.toString() || '',
        description: position.description || '',
        executedAt: position.executedAt
          ? new Date(position.executedAt).toISOString().slice(0, 16)
          : '',
        pnl: position.pnl?.toString() || ''
      });
    }
  }, [position]);

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
        type: formData.type as PositionType,
        status: formData.status as PositionStatus,
        marketId: formData.marketId || undefined,
        quantity: quantity,
        description: formData.description || undefined,
        executedAt: formData.executedAt
          ? new Date(formData.executedAt)
          : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined
      };

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
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
                  <SelectItem value='PENDING'>Processing</SelectItem>
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
