'use client';

import { useState } from 'react';
import {
  IconChartLine,
  IconTrendingUp,
  IconPencil,
  IconFullscreen,
  IconSettings
} from '@tabler/icons-react';

const TIMEFRAMES = ['m1', 'm5', 'm15', 'm30', 'H1', 'H4', 'D1', 'W1'];

interface TradingRoomChartBarProps {
  symbol: string;
  high?: number;
  low?: number;
  interval?: string;
  onIntervalChange?: (interval: string) => void;
}

export function TradingRoomChartBar({
  symbol,
  high = 0,
  low = 0,
  interval = 'H1',
  onIntervalChange
}: TradingRoomChartBarProps) {
  const [activeTimeframe, setActiveTimeframe] = useState(interval);

  const handleTimeframe = (tf: string) => {
    setActiveTimeframe(tf);
    onIntervalChange?.(tf);
  };

  return (
    <div className='flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3'>
      <div className='flex items-center gap-4'>
        <span className='font-semibold text-foreground'>{symbol}</span>
        <span className='text-muted-foreground text-sm'>
          H {high >= 1 ? high.toFixed(5) : high.toFixed(3)} L{' '}
          {low >= 1 ? low.toFixed(5) : low.toFixed(3)}
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex rounded border border-border bg-muted/30 p-0.5'>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type='button'
              onClick={() => handleTimeframe(tf)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                activeTimeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground rounded p-1.5'
            aria-label='Chart type'
          >
            <IconChartLine className='size-4' />
          </button>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground rounded p-1.5'
            aria-label='Indicators'
          >
            <IconTrendingUp className='size-4' />
          </button>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground rounded p-1.5'
            aria-label='Drawing tools'
          >
            <IconPencil className='size-4' />
          </button>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground rounded p-1.5'
            aria-label='Fullscreen'
          >
            <IconFullscreen className='size-4' />
          </button>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground rounded p-1.5'
            aria-label='Settings'
          >
            <IconSettings className='size-4' />
          </button>
        </div>
        <span className='text-muted-foreground text-xs'>
          {new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC'
          })}{' '}
          (UTC +0)
        </span>
      </div>
    </div>
  );
}
