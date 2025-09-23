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
import { User } from '@/constants/data';
import {
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  Shield,
  ShieldOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteUser, updateUser } from '../../sevices/users';
import { toast } from 'sonner';

interface CellActionProps {
  data: User;
  onDataChange?: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onDataChange
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      await deleteUser(data.id);
      toast.success('User deleted successfully');
      onDataChange?.();
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Delete user error:', error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onView = () => {
    router.push(`/admin/users/${data.id}`);
  };

  const onEdit = () => {
    router.push(`/admin/users/${data.id}/edit`);
  };

  const onToggleRole = async () => {
    try {
      setLoading(true);
      const newRole = data.role === 'USER' ? 'ADMIN' : 'USER';
      await updateUser(data.id, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      onDataChange?.();
    } catch (error) {
      toast.error('Failed to update user role');
      // eslint-disable-next-line no-console
      console.error('Update user role error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={loading}>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}>
            <Eye className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          {data.role !== 'SUPERADMIN' && (
            <DropdownMenuItem onClick={onToggleRole}>
              {data.role === 'ADMIN' ? (
                <>
                  <ShieldOff className='mr-2 h-4 w-4' /> Revoke Admin
                </>
              ) : (
                <>
                  <Shield className='mr-2 h-4 w-4' /> Make Admin
                </>
              )}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className='text-red-600 focus:text-red-600'
          >
            <Trash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
