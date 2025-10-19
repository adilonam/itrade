'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { IconSearch, IconUser } from '@tabler/icons-react';

interface UserThemeSettings {
  themeMode: string;
  themeColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserThemeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [userSettings, setUserSettings] = useState<UserThemeSettings>({
    themeMode: 'system',
    themeColor: 'default',
    reducedMotion: false,
    highContrast: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Search for users
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await fetch(
        `/api/super-admin/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        if (data.users.length === 0) {
          toast.info('No users found matching your search');
        }
      } else {
        toast.error('Failed to search users');
      }
    } catch (error) {
      console.error('Failed to search users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load user's theme settings
  const loadUserSettings = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/super-admin/user-theme-settings?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserSettings({
          themeMode: data.themeMode || 'system',
          themeColor: data.themeColor || 'default',
          reducedMotion: data.reducedMotion || false,
          highContrast: data.highContrast || false
        });
      } else {
        toast.error('Failed to load user settings');
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      toast.error('Failed to load user settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user's theme settings
  const updateUserSettings = async (updates: Partial<UserThemeSettings>) => {
    if (!selectedUserId) return;

    try {
      const response = await fetch('/api/super-admin/user-theme-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUserId,
          ...updates
        })
      });

      if (response.ok) {
        setUserSettings((prev) => ({ ...prev, ...updates }));
        toast.success('User theme settings updated successfully');
      } else {
        toast.error('Failed to update user settings');
      }
    } catch (error) {
      console.error('Failed to update user settings:', error);
      toast.error('Failed to update user settings');
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    loadUserSettings(userId);
  };

  const selectedUser = users.find((user) => user.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Theme Management</CardTitle>
        <CardDescription>
          Search for users and manage their individual theme preferences
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* User Search */}
        <div className='space-y-4'>
          <Label className='text-base font-semibold'>Search Users</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search by name or email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <Button onClick={searchUsers} disabled={isLoadingUsers}>
              {isLoadingUsers ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* User Selection */}
          {users.length > 0 && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Select User</Label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder='Choose a user to manage' />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className='flex items-center gap-2'>
                        <IconUser className='h-4 w-4' />
                        <div>
                          <div className='font-medium'>{user.name}</div>
                          <div className='text-muted-foreground text-xs'>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedUser && (
          <>
            <Separator />

            {/* Selected User Info */}
            <div className='bg-muted/50 rounded-lg border p-4'>
              <div className='mb-2 flex items-center gap-2'>
                <IconUser className='h-4 w-4' />
                <span className='font-medium'>Managing themes for:</span>
              </div>
              <div className='text-sm'>
                <div className='font-medium'>{selectedUser.name}</div>
                <div className='text-muted-foreground'>
                  {selectedUser.email}
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            {isLoading ? (
              <div className='text-muted-foreground py-8 text-center'>
                Loading user settings...
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Theme Mode */}
                <div className='space-y-2'>
                  <Label className='text-base font-semibold'>Color Mode</Label>
                  <Select
                    value={userSettings.themeMode}
                    onValueChange={(value) =>
                      updateUserSettings({ themeMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='light'>Light</SelectItem>
                      <SelectItem value='dark'>Dark</SelectItem>
                      <SelectItem value='system'>System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme Color */}
                <div className='space-y-2'>
                  <Label className='text-base font-semibold'>Color Theme</Label>
                  <Select
                    value={userSettings.themeColor}
                    onValueChange={(value) =>
                      updateUserSettings({ themeColor: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='default'>Default</SelectItem>
                      <SelectItem value='blue'>Blue</SelectItem>
                      <SelectItem value='green'>Green</SelectItem>
                      <SelectItem value='amber'>Amber</SelectItem>
                      <SelectItem value='default-scaled'>
                        Default Scaled
                      </SelectItem>
                      <SelectItem value='blue-scaled'>Blue Scaled</SelectItem>
                      <SelectItem value='mono-scaled'>Mono Scaled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Additional Settings */}
                <div className='space-y-4'>
                  <Label className='text-base font-semibold'>
                    Additional Settings
                  </Label>

                  <div className='flex items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <div className='text-sm font-medium'>Reduced Motion</div>
                      <div className='text-muted-foreground text-xs'>
                        Minimize animations and transitions
                      </div>
                    </div>
                    <Switch
                      checked={userSettings.reducedMotion}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ reducedMotion: checked })
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <div className='text-sm font-medium'>High Contrast</div>
                      <div className='text-muted-foreground text-xs'>
                        Increase contrast for better visibility
                      </div>
                    </div>
                    <Switch
                      checked={userSettings.highContrast}
                      onCheckedChange={(checked) =>
                        updateUserSettings({ highContrast: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
