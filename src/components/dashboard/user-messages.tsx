'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconLoader2,
  IconMail,
  IconMailOpened,
  IconPlus,
  IconX,
  IconRefresh
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type MessageWithUsers = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
  receiver: {
    id: string;
    name: string | null;
    email: string;
  };
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function UserMessages() {
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/user/messages?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setPagination({
        ...pagination,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load messages'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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
      setShowCreateForm(false);
      loadMessages();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Messages with your seller ({pagination.total} total)
            </CardDescription>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => loadMessages()}
              disabled={loading}
            >
              <IconRefresh
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size='sm'
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <IconPlus className='mr-2 h-4 w-4' />
              New Message
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {showCreateForm && (
          <Card className='border-2'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>
                  Send Message to Seller
                </CardTitle>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setShowCreateForm(false);
                    setMessage('');
                  }}
                >
                  <IconX className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='message'>Message</Label>
                  <Textarea
                    id='message'
                    placeholder='Enter your message...'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setShowCreateForm(false);
                      setMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={submitting}>
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
        )}

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <IconLoader2 className='h-6 w-6 animate-spin' />
            <span className='ml-2'>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <p className='text-muted-foreground'>No messages found</p>
              <p className='text-muted-foreground mt-1 text-sm'>
                Start a conversation with your seller
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <ScrollArea className='h-[400px] w-full rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {message.sender.name || 'No Name'}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {message.sender.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {message.receiver.name || 'No Name'}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {message.receiver.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='max-w-md'>
                        <div className='line-clamp-2 text-sm'>
                          {message.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={message.read ? 'default' : 'secondary'}
                          className='text-xs'
                        >
                          {message.read ? (
                            <>
                              <IconMailOpened className='mr-1 h-3 w-3' />
                              Read
                            </>
                          ) : (
                            <>
                              <IconMail className='mr-1 h-3 w-3' />
                              Unread
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground text-xs'>
                        {formatDate(message.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation='vertical' />
            </ScrollArea>

            {pagination.pages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1)
                      }))
                    }
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1)
                      }))
                    }
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
