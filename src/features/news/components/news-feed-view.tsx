'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconNews } from '@tabler/icons-react';
import Image from 'next/image';
import {
  type AlphaVantageNewsFeedItem,
  formatAlphaVantageNewsDateTime
} from '@/lib/alphavantage-news';

type NewsItem = AlphaVantageNewsFeedItem;

type NewsResponse = {
  feed?: NewsItem[];
  items?: string;
  sentiment_score_definition?: string;
  relevance_score_definition?: string;
};

function sentimentColor(label?: string): string {
  if (!label) return 'bg-muted';
  const l = label.toLowerCase();
  if (l.includes('bullish'))
    return 'bg-green-100 text-green-800 border-green-200';
  if (l.includes('bearish')) return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-muted text-muted-foreground';
}

export function NewsFeedView() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news')
      .then((res) => {
        if (!res.ok)
          return res
            .json()
            .then((e) => Promise.reject(e?.error ?? res.statusText));
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='flex items-center gap-2 text-lg font-semibold'>
          <IconNews className='h-5 w-5' />
          News & Sentiment
        </h2>
        <div className='text-muted-foreground'>Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='flex items-center gap-2 text-lg font-semibold'>
          <IconNews className='h-5 w-5' />
          News & Sentiment
        </h2>
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const feed = data?.feed ?? [];

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='flex items-center gap-2 text-lg font-semibold'>
        <IconNews className='h-5 w-5' />
        News & Sentiment
      </h2>
      {feed.length === 0 ? (
        <p className='text-muted-foreground'>No news items available.</p>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {feed.map((item, idx) => (
            <Card key={idx} className='overflow-hidden'>
              <a
                href={item.url}
                target='_blank'
                rel='noopener noreferrer'
                className='block transition-opacity hover:opacity-95'
              >
                {item.banner_image && (
                  <div className='bg-muted relative aspect-video w-full'>
                    <Image
                      src={item.banner_image}
                      alt=''
                      fill
                      className='object-cover'
                      sizes='(max-width: 768px) 100vw, 50vw'
                      unoptimized
                    />
                  </div>
                )}
                <CardHeader className='pb-2'>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <span className='text-muted-foreground text-xs'>
                      {item.source}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {formatAlphaVantageNewsDateTime(item.time_published)}
                    </span>
                    {item.overall_sentiment_label && (
                      <Badge
                        variant='outline'
                        className={sentimentColor(item.overall_sentiment_label)}
                      >
                        {item.overall_sentiment_label}
                      </Badge>
                    )}
                  </div>
                  <h3 className='line-clamp-2 leading-tight font-semibold'>
                    {item.title}
                  </h3>
                </CardHeader>
                <CardContent className='pt-0'>
                  <p className='text-muted-foreground line-clamp-3 text-sm'>
                    {item.summary}
                  </p>
                  {item.ticker_sentiment &&
                    item.ticker_sentiment.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {item.ticker_sentiment.slice(0, 5).map((t, i) => (
                          <Badge
                            key={i}
                            variant='secondary'
                            className='text-xs'
                          >
                            {t.ticker} {t.ticker_sentiment_label}
                          </Badge>
                        ))}
                      </div>
                    )}
                </CardContent>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
