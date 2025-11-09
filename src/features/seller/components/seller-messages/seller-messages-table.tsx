'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconMail,
  IconMailOpened,
  IconCheck
} from '@tabler/icons-react';

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

interface SellerMessagesTableProps {
  messages: MessageWithUsers[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onMarkAsRead: (messageId: string) => void;
  onPageChange: (page: number) => void;
}

export function SellerMessagesTable({
  messages,
  loading,
  pagination,
  onMarkAsRead,
  onPageChange
}: SellerMessagesTableProps) {
  const [markingAsReadId, setMarkingAsReadId] = useState<string | null>(null);

  const handleMarkAsRead = async (messageId: string) => {
    setMarkingAsReadId(messageId);
    try {
      await onMarkAsRead(messageId);
    } finally {
      setMarkingAsReadId(null);
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

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>Loading messages...</span>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Messages with your linked users will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No messages found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Start a conversation with your linked users
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages ({pagination.total})</CardTitle>
        <CardDescription>
          View and manage messages with your linked users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative flex min-h-[600px] flex-col'>
          <div className='flex flex-1 flex-col space-y-4'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
                <ScrollArea className='h-full w-full'>
                  <Table>
                    <TableHeader className='bg-muted sticky top-0 z-10'>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
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
                          <TableCell className='text-right'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleMarkAsRead(message.id)}
                              disabled={
                                markingAsReadId === message.id || message.read
                              }
                            >
                              {markingAsReadId === message.id ? (
                                <IconLoader2 className='h-4 w-4 animate-spin' />
                              ) : message.read ? (
                                <IconMailOpened className='h-4 w-4' />
                              ) : (
                                <IconCheck className='h-4 w-4' />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>
              </div>
            </div>
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='mt-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                >
                  <IconChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() =>
                    onPageChange(
                      Math.min(pagination.pages, pagination.page + 1)
                    )
                  }
                  disabled={pagination.page >= pagination.pages}
                >
                  <IconChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
