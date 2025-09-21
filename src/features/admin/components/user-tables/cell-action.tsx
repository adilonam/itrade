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

interface CellActionProps {
  data: User;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    // Handle user deletion
    setLoading(true);
    // TODO: Implement actual delete functionality
    // await deleteUser(data.id);
    setLoading(false);
    setOpen(false);
  };

  const onView = () => {
    router.push(`/admin/users/${data.id}`);
  };

  const onEdit = () => {
    router.push(`/admin/users/${data.id}/edit`);
  };

  const onToggleRole = () => {
    // TODO: Implement role toggle functionality
    // await updateUserRole(data.id, newRole);
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
          <Button variant='ghost' className='h-8 w-8 p-0'>
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
          <DropdownMenuItem onClick={onToggleRole}>
            {data.role === 'ADMIN' || data.role === 'SUPERADMIN' ? (
              <>
                <ShieldOff className='mr-2 h-4 w-4' /> Revoke Admin
              </>
            ) : (
              <>
                <Shield className='mr-2 h-4 w-4' /> Make Admin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
