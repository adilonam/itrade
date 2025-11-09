'use client';

import { useState, useEffect, useCallback } from 'react';
import { SellerMessagesTable } from './seller-messages/seller-messages-table';
import { SellerMessageCreation } from './seller-messages/seller-message-creation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

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

export default function SellerMessagesListing() {
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/seller/messages?${params.toString()}`);

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

  const handleMessageCreated = () => {
    setShowCreateForm(false);
    loadMessages();
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/seller/messages/${messageId}/read`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      toast.success('Message marked as read');
      loadMessages();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark message as read'
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => loadMessages()}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <IconPlus className='mr-2 h-4 w-4' />
          New Message
        </Button>
      </div>

      {showCreateForm && (
        <SellerMessageCreation
          onMessageCreated={handleMessageCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <SellerMessagesTable
        messages={messages}
        loading={loading}
        pagination={pagination}
        onMarkAsRead={handleMarkAsRead}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
