'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { createMarket, CreateMarketParams } from '../services/markets';
import { toast } from 'sonner';

const formSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(12, 'Symbol must be 12 characters or less')
    .regex(
      /^[A-Z0-9\-\/\.]+$/,
      'Symbol can only contain uppercase letters, numbers, hyphens, slashes, and dots'
    ),
  type: z.enum(['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'], {
    required_error: 'Please select a market type'
  }),
  spread: z.coerce.number().min(0, 'Spread must be non-negative').optional(),
  visible: z.boolean().optional()
});

type FormData = z.infer<typeof formSchema>;

interface AddMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddMarketDialog({
  open,
  onOpenChange,
  onSuccess
}: AddMarketDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: '',
      spread: 0,
      visible: true
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const marketData: CreateMarketParams = {
        symbol: data.symbol.toUpperCase(),
        type: data.type,
        ...(data.spread !== undefined && { spread: data.spread }),
        ...(data.visible !== undefined && { visible: data.visible })
      };

      await createMarket(marketData);

      toast.success('Market created successfully');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create market. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Add New Market</DialogTitle>
          <DialogDescription>
            Add a new market to the trading platform. The symbol will be
            validated against the TwelveData API.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='symbol'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., EURUSD, AAPL, BTCUSD'
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select market type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='FOREX'>Forex</SelectItem>
                      <SelectItem value='CRYPTO'>Cryptocurrency</SelectItem>
                      <SelectItem value='STOCKS'>Stocks</SelectItem>
                      <SelectItem value='COMMODITIES'>Commodities</SelectItem>
                      <SelectItem value='INDICES'>Indices</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='spread'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spread (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.00001'
                      min='0'
                      placeholder='0.00002'
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='visible'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Visible to Users
                    </FormLabel>
                    <div className='text-muted-foreground text-sm'>
                      Make this market visible in the user dashboard
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create Market'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
