'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { IconLoader2, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

type User = {
  id: string;
  name: string | null;
  email: string;
};

interface SellerMessageCreationProps {
  onMessageCreated: () => void;
  onCancel: () => void;
}

export function SellerMessageCreation({
  onMessageCreated,
  onCancel
}: SellerMessageCreationProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailFilter, setEmailFilter] = useState('');
  const [debouncedEmailFilter, setDebouncedEmailFilter] = useState('');

  // Debounce email filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmailFilter(emailFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [emailFilter]);

  // Load linked users with lazy filtering
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const params = new URLSearchParams({ limit: '100' });
        if (debouncedEmailFilter.trim()) {
          params.set('search', debouncedEmailFilter.trim());
        }
        const response = await fetch(`/api/seller/users?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load users');
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load users'
        );
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [debouncedEmailFilter]);

  // Update selected user when userId changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !message.trim()) {
      toast.error('Please select a user and enter a message');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/seller/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedUserId,
          message: message.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast.success('Message sent successfully');
      setMessage('');
      setSelectedUserId('');
      setSelectedUser(null);
      onMessageCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users client-side based on email filter
  const filteredUsers = users.filter((user) => {
    if (!emailFilter.trim()) return true;
    const filterLower = emailFilter.toLowerCase();
    return (
      user.email.toLowerCase().includes(filterLower) ||
      (user.name && user.name.toLowerCase().includes(filterLower))
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Create New Message</CardTitle>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <IconX className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='user-select'>Select User</Label>
            <div className='flex flex-wrap items-center gap-2'>
              <Input
                id='user-search'
                placeholder='Search by email...'
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className='h-9 w-48 shrink-0'
              />
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers || submitting}
              >
                <SelectTrigger
                  id='user-select'
                  className='min-w-[200px] flex-1'
                >
                  <SelectValue placeholder='Select a linked user' />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className='flex items-center justify-center p-4'>
                      <IconLoader2 className='h-4 w-4 animate-spin' />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className='text-muted-foreground p-4 text-center text-sm'>
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div>
                          <div className='font-medium'>
                            {user.name || 'No Name'}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {user.email}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className='text-muted-foreground text-sm'>
                Selected: {selectedUser.name || 'No Name'} ({selectedUser.email}
                )
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              placeholder='Enter your message...'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={submitting}
              required
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={submitting || !selectedUserId}>
              {submitting ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
