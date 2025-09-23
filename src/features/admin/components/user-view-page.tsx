'use client';

import { useEffect, useState } from 'react';
import { fetchUserById } from '../sevices/users';
import { useRouter } from 'next/navigation';
import UserForm from './user-form';
import { User } from '@/constants/data';
import FormCardSkeleton from '@/components/form-card-skeleton';

type TUserViewPageProps = {
  userId: string;
};

export default function UserViewPage({ userId }: TUserViewPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pageTitle = userId === 'new' ? 'Create New User' : 'Edit User';

  useEffect(() => {
    if (userId === 'new') {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData);
      } catch (err) {
        setError('User not found');
        // Navigate to 404 after a short delay
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

  if (error) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-red-600'>Error</h3>
          <p className='mt-2 text-sm text-gray-600'>{error}</p>
          <p className='mt-2 text-sm text-gray-500'>
            Redirecting to users list...
          </p>
        </div>
      </div>
    );
  }

  return <UserForm initialData={user} pageTitle={pageTitle} />;
}
