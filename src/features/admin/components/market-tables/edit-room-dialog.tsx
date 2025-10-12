'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AdminMarket, updateMarket } from '../../services/markets';
import { toast } from 'sonner';

interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AdminMarket;
  onSuccess?: () => void;
}

export function EditRoomDialog({
  open,
  onOpenChange,
  data,
  onSuccess
}: EditRoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(data.room);

  const onSubmit = async () => {
    try {
      setLoading(true);

      await updateMarket(data.id, { room: selectedRoom });

      toast.success('Market room updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update market room. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRoom(data.room);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Market Room</DialogTitle>
          <DialogDescription>
            Change the room for <strong>{data.symbol}</strong>. This determines
            where the market is displayed.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Market Room</label>
            <Select
              value={selectedRoom}
              onValueChange={(value) =>
                setSelectedRoom(value as typeof selectedRoom)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select market room' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='TRADING'>Trading Only</SelectItem>
                <SelectItem value='STOCK'>Stock Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
