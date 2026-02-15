'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconMail,
  IconMailOpened,
  IconLoader2,
  IconArrowRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner';

type MessageStats = {
  total: number;
  unread: number;
};

export function UserMessages() {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/user/messages/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!cancelled)
          setStats({ total: data.total ?? 0, unread: data.unread ?? 0 });
      } catch {
        if (!cancelled) toast.error('Failed to load message stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Messages with your seller</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  const total = stats?.total ?? 0;
  const unread = stats?.unread ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
        <CardDescription>Messages with your seller</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
              <IconMailOpened className='text-muted-foreground h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-semibold'>{total}</p>
              <p className='text-muted-foreground text-sm'>Total messages</p>
            </div>
          </div>
          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
              <IconMail className='text-muted-foreground h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-semibold'>{unread}</p>
              <p className='text-muted-foreground text-sm'>Unread</p>
            </div>
          </div>
        </div>
        <Button asChild variant='outline' className='w-full sm:w-auto'>
          <Link href='/messages'>
            View messages
            <IconArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
