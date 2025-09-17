'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfileViewPage() {
  const { data: session, update } = useSession();
  console.log('Session data:', session);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just update the session
      await update({ name });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex w-full flex-col space-y-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex items-center space-x-4'>
            <UserAvatarProfile user={session.user} className='h-16 w-16' />
            <div>
              <h3 className='text-lg font-medium'>{session.user.name}</h3>
              <p className='text-muted-foreground text-sm'>
                {session.user.email}
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              {isEditing ? (
                <Input
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <div className='bg-muted rounded-md p-2'>
                  {session.user.name || 'No name set'}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='bg-muted rounded-md p-2'>
                {session.user.email}
              </div>
            </div>
          </div>

          <div className='flex space-x-2'>
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant='outline' onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
