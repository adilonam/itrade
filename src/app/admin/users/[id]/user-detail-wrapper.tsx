'use client';

import { useEffect, useState } from 'react';
import { fetchUserById } from '@/features/admin/services/users';
import { useRouter } from 'next/navigation';
import UserDetail from '@/features/admin/components/user-detail';
import { User } from '@prisma/client';
import FormCardSkeleton from '@/components/form-card-skeleton';

type UserDetailWrapperProps = {
  userId: string;
};

export default function UserDetailWrapper({ userId }: UserDetailWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData);
      } catch (err) {
        setError('User not found');
        // Navigate to users list after a short delay
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, router]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  if (error || !user) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-red-600'>Error</h3>
          <p className='mt-2 text-sm text-gray-600'>
            {error || 'User not found'}
          </p>
          <p className='mt-2 text-sm text-gray-500'>
            Redirecting to users list...
          </p>
        </div>
      </div>
    );
  }

  return <UserDetail user={user} onUserUpdate={setUser} />;
}
