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
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type AccountInfo = { provider: string; providerAccountId: string };

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  accounts?: AccountInfo[];
  hasPassword?: boolean;
};

export default function ProfileViewPage() {
  const { data: session, update: updateSession, status } = useSession();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/user/profile');
    if (!res.ok) return;
    const data = await res.json();
    const user = data.user as ProfileUser;
    setProfile(user);
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setDateOfBirth(
      user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
        : ''
    );
    setAddress(user.address ?? '');
    setPostalCode(user.postalCode ?? '');
    setCity(user.city ?? '');
  }, []);

  useEffect(() => {
    if (status === 'authenticated')
      fetchProfile().finally(() => setLoading(false));
  }, [status, fetchProfile]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('phone', phone);
      formData.set('dateOfBirth', dateOfBirth);
      formData.set('address', address);
      formData.set('postalCode', postalCode);
      formData.set('city', city);
      if (imageFile) formData.set('image', imageFile);

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update profile');
      }
      const data = await res.json();
      setProfile(data.user);
      setImageFile(null);
      await updateSession({ name: data.user.name, image: data.user.image });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/user/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to change password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePasswordOpen(false);
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to change password'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      const res = await fetch('/api/user/profile/accounts/unlink-google', {
        method: 'POST'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to unlink');
      await fetchProfile();
      toast.success('Google account unlinked');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to unlink Google'
      );
    }
  };

  const hasGoogle = profile?.accounts?.some((a) => a.provider === 'google');
  const displayUser = profile ?? session?.user;

  if (status === 'loading' || loading) {
    return (
      <div className='flex w-full items-center justify-center p-8'>
        <span className='text-muted-foreground'>Loading...</span>
      </div>
    );
  }

  if (!session?.user || !displayUser) {
    return (
      <div className='flex w-full items-center justify-center p-8'>
        <span className='text-muted-foreground'>
          Please sign in to view your profile.
        </span>
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex flex-col items-center gap-2'>
              <UserAvatarProfile
                user={{
                  ...displayUser,
                  image: imageFile
                    ? URL.createObjectURL(imageFile)
                    : displayUser.image
                }}
                className='h-20 w-20'
              />
              {isEditing && (
                <>
                  <Label
                    htmlFor='profile-image-upload'
                    className='text-primary cursor-pointer text-center text-xs underline underline-offset-2 hover:no-underline'
                  >
                    Upload image
                  </Label>
                  <Input
                    id='profile-image-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </>
              )}
            </div>
            <div>
              <h3 className='text-lg font-medium'>
                {displayUser.name || 'No name set'}
              </h3>
              <p className='text-muted-foreground text-sm'>
                {displayUser.email}
              </p>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              {isEditing ? (
                <Input
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Your name'
                />
              ) : (
                <div className='bg-muted rounded-md px-3 py-2'>
                  {displayUser.name || '—'}
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='bg-muted text-muted-foreground rounded-md px-3 py-2'>
                {displayUser.email}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Téléphone</Label>
              {isEditing ? (
                <Input
                  id='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='+33 6 12 34 56 78'
                />
              ) : (
                <div className='bg-muted rounded-md px-3 py-2'>
                  {profile?.phone || '—'}
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='dateOfBirth'>Date de naissance</Label>
              {isEditing ? (
                <Input
                  id='dateOfBirth'
                  type='date'
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              ) : (
                <div className='bg-muted rounded-md px-3 py-2'>
                  {profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : '—'}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='address'>Adresse</Label>
                <Input
                  id='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder='123 rue Example'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='postalCode'>Code postal</Label>
                <Input
                  id='postalCode'
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder='75001'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='city'>Ville</Label>
                <Input
                  id='city'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='Paris'
                />
              </div>
            </div>
          )}

          {!isEditing &&
            (profile?.address || profile?.postalCode || profile?.city) && (
              <div className='space-y-2'>
                <Label>Adresse</Label>
                <div className='bg-muted rounded-md px-3 py-2'>
                  {[
                    profile?.address,
                    [profile?.postalCode, profile?.city]
                      .filter(Boolean)
                      .join(' ')
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </div>
              </div>
            )}

          <div className='flex flex-wrap gap-2'>
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setIsEditing(false);
                    setImageFile(null);
                    setName(profile?.name ?? '');
                    setPhone(profile?.phone ?? '');
                    setDateOfBirth(
                      profile?.dateOfBirth
                        ? new Date(profile.dateOfBirth)
                            .toISOString()
                            .slice(0, 10)
                        : ''
                    );
                    setAddress(profile?.address ?? '');
                    setPostalCode(profile?.postalCode ?? '');
                    setCity(profile?.city ?? '');
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {profile?.hasPassword ? 'Change Password' : 'Set Password'}
          </CardTitle>
          <CardDescription>
            {profile?.hasPassword
              ? 'Update your password.'
              : 'You signed in with Google and have no password. Set one to also sign in with email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!changePasswordOpen ? (
            <Button
              variant='outline'
              onClick={() => setChangePasswordOpen(true)}
            >
              {profile?.hasPassword ? 'Change Password' : 'Set Password'}
            </Button>
          ) : (
            <div className='max-w-sm space-y-4'>
              {profile?.hasPassword && (
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current password</Label>
                  <Input
                    id='currentPassword'
                    type='password'
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='••••••••'
                  />
                </div>
              )}
              <div className='space-y-2'>
                <Label htmlFor='newPassword'>
                  {profile?.hasPassword ? 'New password' : 'Password'}
                </Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    (!!profile?.hasPassword && !currentPassword)
                  }
                >
                  {changingPassword
                    ? 'Updating...'
                    : profile?.hasPassword
                      ? 'Update password'
                      : 'Set password'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Account</CardTitle>
          <CardDescription>
            Link or unlink your Google account for signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {hasGoogle ? (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-muted-foreground text-sm'>
                Your account is linked with Google.
              </span>
              <Button variant='outline' size='sm' onClick={handleUnlinkGoogle}>
                Unlink Google
              </Button>
            </div>
          ) : (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-muted-foreground text-sm'>
                Link your Google account to sign in with it.
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  signIn('google', { callbackUrl: '/profile', redirect: true })
                }
              >
                Link Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
