'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash, Eye, EyeOff, Edit } from 'lucide-react';
import { useState } from 'react';
import {
  AdminMarket,
  deleteMarket,
  updateMarket
} from '../../services/markets';
import { toast } from 'sonner';
import { EditMarketDialog } from './edit-market-dialog';

interface CellActionProps {
  data: AdminMarket;
  onDataChange?: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onDataChange
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMarketOpen, setEditMarketOpen] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  const onDeleteConfirm = async () => {
    try {
      setLoading(true);
      await deleteMarket(data.id);
      toast.success('Market deleted successfully');
      onDataChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete market. Please try again.'
      );
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const toggleVisibility = async () => {
    try {
      setVisibilityLoading(true);
      await updateMarket(data.id, { visible: !data.visible });
      toast.success(
        `Market ${data.visible ? 'hidden' : 'made visible'} successfully`
      );
      onDataChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update market visibility. Please try again.'
      );
    } finally {
      setVisibilityLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDeleteConfirm}
        loading={loading}
      />
      <EditMarketDialog
        open={editMarketOpen}
        onOpenChange={setEditMarketOpen}
        data={data}
        onSuccess={onDataChange}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setEditMarketOpen(true)}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={toggleVisibility}
            disabled={visibilityLoading}
          >
            {data.visible ? (
              <EyeOff className='mr-2 h-4 w-4' />
            ) : (
              <Eye className='mr-2 h-4 w-4' />
            )}
            {data.visible ? 'Hide Market' : 'Show Market'}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className='text-red-600'
          >
            <Trash className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
