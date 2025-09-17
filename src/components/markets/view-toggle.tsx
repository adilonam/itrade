'use client';

import { Button } from '@/components/ui/button';
import { ViewType } from '@/types';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  className
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        'bg-muted flex items-center space-x-1 rounded-lg p-1',
        className
      )}
    >
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('cards')}
        className='h-8 px-3'
      >
        <IconLayoutGrid className='mr-2 h-4 w-4' />
        Cards
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('list')}
        className='h-8 px-3'
      >
        <IconList className='mr-2 h-4 w-4' />
        List
      </Button>
    </div>
  );
}
