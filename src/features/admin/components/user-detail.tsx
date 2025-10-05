'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@prisma/client';
import { format } from 'date-fns';
import {
  Edit,
  Mail,
  Shield,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  DollarSign,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateUserBalance } from '@/features/admin/services/users';
import { useSession } from 'next-auth/react';

type UserDetailProps = {
  user: User;
  onUserUpdate?: (updatedUser: User) => void;
};

export default function UserDetail({ user, onUserUpdate }: UserDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState(user.balance.toString());
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  // Check if current user is trying to modify their own account
  const isOwnAccount = session?.user?.id === user.id;

  const handleBalanceUpdate = async () => {
    try {
      setIsUpdatingBalance(true);
      const newBalance = parseFloat(balanceValue);
      if (isNaN(newBalance) || newBalance < 0) {
        alert('Please enter a valid positive number');
        return;
      }

      const updatedUser = await updateUserBalance(user.id, newBalance);
      // Update the user object with the new balance
      user.balance = newBalance;
      // Notify parent component of the update
      onUserUpdate?.(updatedUser);
      setIsEditingBalance(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update balance:', error);
      alert('Failed to update balance. Please try again.');
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleBalanceCancel = () => {
    setBalanceValue(user.balance.toString());
    setIsEditingBalance(false);
  };

  const getRoleConfig = (role: string) => {
    const roleConfig = {
      USER: { variant: 'secondary' as const, icon: UserIcon, label: 'User' },
      ADMIN: { variant: 'default' as const, icon: Shield, label: 'Admin' },
      SUPERADMIN: {
        variant: 'destructive' as const,
        icon: Shield,
        label: 'Super Admin'
      }
    };
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
  };

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className='space-y-6'>
      {isOwnAccount && (
        <div className='flex items-center space-x-2 rounded-md bg-blue-50 p-4 text-blue-800'>
          <AlertTriangle className='h-5 w-5' />
          <div>
            <p className='font-medium'>Editing Your Own Account</p>
            <p className='text-sm'>
              You are currently viewing and editing your own account.
            </p>
          </div>
        </div>
      )}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>User Details</h1>
            <p className='text-muted-foreground'>
              View and manage user information
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/users/${user.id}/edit`)}>
          <Edit className='mr-2 h-4 w-4' />
          Edit User
        </Button>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {/* User Avatar and Basic Info */}
        <Card className='col-span-full lg:col-span-1'>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='flex h-20 w-20 items-center justify-center'>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.email}
                    width={80}
                    height={80}
                    className='rounded-full object-cover'
                  />
                ) : (
                  <div className='bg-muted flex h-20 w-20 items-center justify-center rounded-full'>
                    <UserIcon className='text-muted-foreground h-8 w-8' />
                  </div>
                )}
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-semibold'>
                  {user.name || 'No Name'}
                </h3>
                <p className='text-muted-foreground text-sm'>{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Mail className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>Email</p>
                <p className='text-muted-foreground text-sm'>{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className='flex items-center space-x-3'>
              <div
                className={`flex h-4 w-4 items-center justify-center ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}
              >
                {user.emailVerified ? (
                  <CheckCircle2 className='h-4 w-4' />
                ) : (
                  <XCircle className='h-4 w-4' />
                )}
              </div>
              <div>
                <p className='text-sm font-medium'>Email Status</p>
                <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role & Permissions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <RoleIcon className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>Role</p>
                <Badge variant={roleConfig.variant} className='mt-1'>
                  <RoleIcon className='mr-1 h-3 w-3' />
                  {roleConfig.label}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className='mb-2 text-sm font-medium'>Permissions</p>
              <div className='text-muted-foreground space-y-1 text-sm'>
                {user.role === 'SUPERADMIN' && (
                  <>
                    <p>• Full system access</p>
                    <p>• Manage all users</p>
                    <p>• System configuration</p>
                  </>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <p>• Manage users</p>
                    <p>• View reports</p>
                    <p>• Moderate content</p>
                  </>
                )}
                {user.role === 'USER' && (
                  <>
                    <p>• Basic user access</p>
                    <p>• Personal data management</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Account Balance</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {isOwnAccount && (
              <div className='flex items-center space-x-2 rounded-md bg-blue-50 p-3 text-blue-800'>
                <AlertTriangle className='h-4 w-4' />
                <p className='text-sm font-medium'>
                  You are editing your own account balance.
                </p>
              </div>
            )}
            <div className='flex items-center space-x-3'>
              <DollarSign className='text-muted-foreground h-4 w-4' />
              <div className='flex-1'>
                <p className='text-sm font-medium'>Current Balance</p>
                {isEditingBalance ? (
                  <div className='mt-2 space-y-2'>
                    <Label htmlFor='balance-input' className='sr-only'>
                      Balance
                    </Label>
                    <Input
                      id='balance-input'
                      type='number'
                      step='0.01'
                      min='0'
                      value={balanceValue}
                      onChange={(e) => setBalanceValue(e.target.value)}
                      placeholder='Enter balance'
                      className='w-full'
                    />
                    <div className='flex space-x-2'>
                      <Button
                        size='sm'
                        onClick={handleBalanceUpdate}
                        disabled={isUpdatingBalance}
                      >
                        <Save className='mr-1 h-3 w-3' />
                        {isUpdatingBalance ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={handleBalanceCancel}
                        disabled={isUpdatingBalance}
                      >
                        <X className='mr-1 h-3 w-3' />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='mt-1 flex items-center justify-between'>
                    <p className='text-2xl font-bold text-green-600'>
                      ${user.balance.toFixed(2)}
                    </p>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setIsEditingBalance(true)}
                    >
                      <Edit className='mr-1 h-3 w-3' />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='flex items-center space-x-3'>
              <Calendar className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>Created</p>
                <p className='text-muted-foreground text-sm'>
                  {format(user.createdAt, "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Calendar className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>Last Updated</p>
                <p className='text-muted-foreground text-sm'>
                  {format(user.updatedAt, "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <UserIcon className='text-muted-foreground h-4 w-4' />
              <div>
                <p className='text-sm font-medium'>User ID</p>
                <p className='text-muted-foreground font-mono text-sm'>
                  {user.id}
                </p>
              </div>
            </div>
            {user.emailVerified && (
              <div className='flex items-center space-x-3'>
                <CheckCircle2 className='text-muted-foreground h-4 w-4' />
                <div>
                  <p className='text-sm font-medium'>Email Verified</p>
                  <p className='text-muted-foreground text-sm'>
                    {format(user.emailVerified, "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
