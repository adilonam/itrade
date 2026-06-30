'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedPnLValueProps {
  value: number;
  positiveClassName: string;
  negativeClassName: string;
  className?: string;
}

export function AnimatedPnLValue({
  value,
  positiveClassName,
  negativeClassName,
  className
}: AnimatedPnLValueProps) {
  const prevValueRef = useRef<number | null>(null);
  const [animation, setAnimation] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev !== null && prev !== value) {
      setAnimation(value > prev ? 'up' : 'down');
      const timer = setTimeout(() => setAnimation(null), 400);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  const baseClass = value >= 0 ? positiveClassName : negativeClassName;
  const formatted = `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`;

  return (
    <span
      className={cn(
        baseClass,
        'inline-block',
        animation === 'up' && 'animate-pnl-flash-up',
        animation === 'down' && 'animate-pnl-flash-down',
        className
      )}
    >
      {formatted}
    </span>
  );
}
