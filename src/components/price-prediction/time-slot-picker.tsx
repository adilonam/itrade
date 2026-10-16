'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PricePredictionTimeSlot } from '@/lib/price-prediction/mock-data';

type TimeSlotPickerProps = {
  slots: PricePredictionTimeSlot[];
  onSlotChange?: (slot: PricePredictionTimeSlot) => void;
};

export function TimeSlotPicker({ slots, onSlotChange }: TimeSlotPickerProps) {
  const [activeId, setActiveId] = useState(
    () => slots.find((s) => s.isActive)?.id ?? slots[0]?.id
  );

  const handleSelect = (slot: PricePredictionTimeSlot) => {
    setActiveId(slot.id);
    onSlotChange?.(slot);
  };

  return (
    <div className='flex flex-wrap gap-2'>
      {slots.map((slot) => (
        <button
          key={slot.id}
          type='button'
          onClick={() => handleSelect(slot)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
            activeId === slot.id
              ? 'border-trade-accent-blue bg-trade-accent-blue/15 text-trade-accent-blue'
              : 'border-trade-border bg-trade-panel text-trade-text-muted hover:border-trade-border/80 hover:text-trade-text'
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}
