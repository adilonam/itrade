import { cn } from '@/lib/utils';

type UpDownGaugeProps = {
  upPercent: number;
  size?: 'sm' | 'md';
  className?: string;
};

export function UpDownGauge({
  upPercent,
  size = 'md',
  className
}: UpDownGaugeProps) {
  const downPercent = 100 - upPercent;
  const radius = size === 'sm' ? 28 : 36;
  const stroke = size === 'sm' ? 5 : 6;
  const circumference = 2 * Math.PI * radius;
  const upOffset = circumference - (upPercent / 100) * circumference;
  const dimension = (radius + stroke) * 2;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className='-rotate-90'
        aria-hidden
      >
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill='none'
          stroke='currentColor'
          strokeWidth={stroke}
          className='text-trade-red/30'
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill='none'
          stroke='currentColor'
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={upOffset}
          strokeLinecap='round'
          className='text-trade-green transition-all duration-500'
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span
          className={cn(
            'font-semibold text-trade-green',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {upPercent}%
        </span>
        <span
          className={cn(
            'text-trade-text-muted',
            size === 'sm' ? 'text-[9px]' : 'text-[10px]'
          )}
        >
          Up
        </span>
      </div>
      <span className='sr-only'>
        {upPercent}% up, {downPercent}% down
      </span>
    </div>
  );
}
