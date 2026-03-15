'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { IconCalendar } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function parseValue(value: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseTime(timeStr: string, base: Date): Date {
  const [h = 0, m = 0] = timeStr.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

interface DateTimePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  placeholder = 'Pick date & time',
  className,
  disabled
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = parseValue(value);
  const timeStr = toTimeString(date);

  const handleSelect = React.useCallback(
    (selected: Date | undefined) => {
      if (!selected) return;
      const withTime = parseTime(timeStr, selected);
      onChange(withTime.toISOString());
    },
    [timeStr, onChange]
  );

  const handleTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = parseTime(e.target.value, date);
      onChange(next.toISOString());
    },
    [date, onChange]
  );

  const displayText = value
    ? `${format(date, 'MMM d, yyyy')} ${toTimeString(date)}`
    : placeholder;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className='text-sm'>
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-9',
              !value && 'text-muted-foreground'
            )}
          >
            <IconCalendar className='mr-2 h-4 w-4' />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
          <div className='border-t p-3'>
            <Label htmlFor={`${id}-time`} className='text-xs text-muted-foreground'>
              Time
            </Label>
            <Input
              id={`${id}-time`}
              type='time'
              value={timeStr}
              onChange={handleTimeChange}
              className='mt-1'
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
