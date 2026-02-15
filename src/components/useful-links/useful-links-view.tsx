'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IconLink, IconLoader2, IconExternalLink } from '@tabler/icons-react';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  order: number;
};

export default function UsefulLinksView() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchLinks() {
      try {
        const res = await fetch('/api/useful-links');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLinks(data.links ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLinks();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className='text-muted-foreground py-12 text-center'>
          No useful links available at the moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {links.map((link) => (
        <Card key={link.id} className='transition-shadow hover:shadow-md'>
          <a
            href={link.url}
            target='_blank'
            rel='noopener noreferrer'
            className='block p-6'
          >
            <CardContent className='flex items-start gap-4 p-0'>
              <div className='bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                <IconLink className='text-muted-foreground h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <h3 className='leading-tight font-semibold'>{link.title}</h3>
                <p className='text-muted-foreground mt-1 truncate text-sm'>
                  {link.url}
                </p>
                <span className='text-primary mt-2 inline-flex items-center gap-1 text-sm'>
                  Open link
                  <IconExternalLink className='h-3.5 w-3.5' />
                </span>
              </div>
            </CardContent>
          </a>
        </Card>
      ))}
    </div>
  );
}
