'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconLoader2, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

interface UserMessageCreationProps {
  onMessageCreated: () => void;
  onCancel: () => void;
}

export function UserMessageCreation({
  onMessageCreated,
  onCancel
}: UserMessageCreationProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/user/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast.success('Message sent successfully');
      setMessage('');
      onMessageCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            <Label htmlFor='message'>Message to Seller</Label>
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
            <Button type='submit' disabled={submitting || !message.trim()}>
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
