'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type CountdownTimerProps = {
  endsAt: number;
  className?: string;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => endsAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(endsAt - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = remaining < 60_000;

  return (
    <span
      className={cn(
        'font-mono text-sm font-semibold tabular-nums',
        isUrgent ? 'text-trade-red' : 'text-trade-green',
        className
      )}
    >
      {formatCountdown(remaining)}
    </span>
  );
}
