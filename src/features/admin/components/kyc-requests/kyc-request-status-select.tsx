'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export const KYC_REQUEST_ROW_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'VERIFIED',
  'REJECTED'
] as const;

export type KycRequestRowStatus = (typeof KYC_REQUEST_ROW_STATUSES)[number];

export function kycRequestRowStatusLabel(status: KycRequestRowStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In progress';
    case 'VERIFIED':
      return 'Verified';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

type KycRequestStatusSelectProps = {
  requestId: string;
  value: KycRequestRowStatus;
  updating: boolean;
  onChange: (requestId: string, next: KycRequestRowStatus) => void;
  triggerClassName?: string;
  contentClassName?: string;
};

export function KycRequestStatusSelect({
  requestId,
  value,
  updating,
  onChange,
  triggerClassName,
  contentClassName
}: KycRequestStatusSelectProps) {
  return (
    <div className='flex items-center gap-2'>
      <Select
        value={value}
        disabled={updating}
        onValueChange={(v) => {
          const next = v as KycRequestRowStatus;
          if (next === value) return;
          onChange(requestId, next);
        }}
      >
        <SelectTrigger
          size='sm'
          className={cn('min-w-[160px]', triggerClassName)}
          aria-label='Set KYC request status'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {KYC_REQUEST_ROW_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {kycRequestRowStatusLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updating ? (
        <IconLoader2
          className='text-muted-foreground h-4 w-4 shrink-0 animate-spin'
          aria-hidden
        />
      ) : null}
    </div>
  );
}
