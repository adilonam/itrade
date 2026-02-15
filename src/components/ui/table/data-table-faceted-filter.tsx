'use client';

import type { Option } from '@/types/data-table';
import type { Column } from '@tanstack/react-table';
import { PlusCircle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  multiple?: boolean;
  /** When set, filter is deferred (search-on-click): selection stored here until Search is clicked */
  pendingValues?: string[];
  setPendingValues?: (values: string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  multiple,
  pendingValues,
  setPendingValues
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);

  const isDeferred =
    pendingValues !== undefined && setPendingValues !== undefined;
  const columnFilterValue = column?.getFilterValue();
  const sourceValues = isDeferred
    ? pendingValues
    : Array.isArray(columnFilterValue)
      ? columnFilterValue
      : [];
  const selectedValues = React.useMemo(
    () => new Set(sourceValues),
    [sourceValues]
  );

  const onItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      if (isDeferred) {
        if (multiple) {
          const newSet = new Set(selectedValues);
          if (isSelected) newSet.delete(option.value);
          else newSet.add(option.value);
          setPendingValues(Array.from(newSet));
        } else {
          setPendingValues(isSelected ? [] : [option.value]);
          setOpen(false);
        }
        return;
      }
      if (!column) return;

      if (multiple) {
        const newSelectedValues = new Set(selectedValues);
        if (isSelected) {
          newSelectedValues.delete(option.value);
        } else {
          newSelectedValues.add(option.value);
        }
        const filterValues = Array.from(newSelectedValues);
        column.setFilterValue(filterValues.length ? filterValues : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [option.value]);
        setOpen(false);
      }
    },
    [column, multiple, selectedValues, isDeferred, setPendingValues]
  );

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isDeferred) setPendingValues([]);
      else column?.setFilterValue(undefined);
    },
    [column, isDeferred, setPendingValues]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='border-dashed'>
          {selectedValues?.size > 0 ? (
            <div
              role='button'
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className='focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none'
            >
              <XCircle />
            </div>
          ) : (
            <PlusCircle />
          )}
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator
                orientation='vertical'
                className='mx-0.5 data-[orientation=vertical]:h-4'
              />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selectedValues.size}
              </Badge>
              <div className='hidden items-center gap-1 lg:flex'>
                {selectedValues.size > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant='secondary'
                        key={option.value}
                        className='rounded-sm px-1 font-normal'
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[12.5rem] p-0' align='start'>
        <Command>
          <CommandInput placeholder={title} />
          <CommandList className='max-h-full'>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className='max-h-[18.75rem] overflow-x-hidden overflow-y-auto'>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onItemSelect(option, isSelected)}
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon />
                    </div>
                    {option.icon && <option.icon />}
                    <span className='truncate'>{option.label}</span>
                    {option.count && (
                      <span className='ml-auto font-mono text-xs'>
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onReset()}
                    className='justify-center text-center'
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
