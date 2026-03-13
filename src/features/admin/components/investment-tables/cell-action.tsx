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
import { MoreHorizontal, Trash, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import {
  AdminInvestment,
  deleteInvestment,
  updateInvestment
} from '../../services/investments';
import { toast } from 'sonner';

interface CellActionProps {
  data: AdminInvestment;
  onDataChange?: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onDataChange
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const onDeleteConfirm = async () => {
    try {
      setLoading(true);
      await deleteInvestment(data.id);
      toast.success('Investment deleted successfully');
      onDataChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete investment. Please try again.'
      );
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const toggleStatus = async () => {
    try {
      setStatusLoading(true);
      await updateInvestment(data.id, { isActive: !data.isActive });
      toast.success(
        `Investment ${data.isActive ? 'deactivated' : 'activated'} successfully`
      );
      onDataChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update investment status. Please try again.'
      );
    } finally {
      setStatusLoading(false);
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
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(data.id)}
          >
            Copy Investment ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleStatus} disabled={statusLoading}>
            {data.isActive ? (
              <>
                <EyeOff className='mr-2 h-4 w-4' />
                Deactivate
              </>
            ) : (
              <>
                <Eye className='mr-2 h-4 w-4' />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className='text-red-600 focus:text-red-600'
          >
            <Trash className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
