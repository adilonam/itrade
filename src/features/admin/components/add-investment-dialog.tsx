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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import {
  createInvestment,
  CreateInvestmentParams
} from '../services/investments';
import { toast } from 'sonner';

const formSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title must be 100 characters or less'),
    description: z
      .string()
      .max(1000, 'Description must be 1000 characters or less')
      .optional(),
    duration: z.coerce
      .number()
      .min(1, 'Duration must be at least 1 day')
      .max(3650, 'Duration cannot exceed 10 years (3650 days)'),
    rentability: z.coerce
      .number()
      .min(0, 'Rentability must be non-negative')
      .max(100, 'Rentability cannot exceed 100%'),
    minInvestment: z.coerce
      .number()
      .min(1, 'Minimum investment must be at least €1'),
    maxInvestment: z.coerce
      .number()
      .min(1, 'Maximum investment must be at least €1')
      .optional(),
    autoReinvestment: z.boolean().default(false),
    totalCapacity: z.coerce
      .number()
      .min(1, 'Total capacity must be at least €1')
      .optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
      required_error: 'Please select a risk level'
    }),
    isActive: z.boolean().default(true),
    imageUrl: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal(''))
  })
  .refine(
    (data) => {
      if (data.maxInvestment && data.maxInvestment <= data.minInvestment) {
        return false;
      }
      return true;
    },
    {
      message: 'Maximum investment must be greater than minimum investment',
      path: ['maxInvestment']
    }
  );

type FormData = z.infer<typeof formSchema>;

interface AddInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddInvestmentDialog({
  open,
  onOpenChange,
  onSuccess
}: AddInvestmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 365,
      rentability: 5.0,
      minInvestment: 1000,
      maxInvestment: undefined,
      autoReinvestment: false,
      totalCapacity: undefined,
      riskLevel: 'MEDIUM',
      isActive: true,
      imageUrl: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const investmentData: CreateInvestmentParams = {
        title: data.title,
        description: data.description || undefined,
        duration: data.duration,
        rentability: data.rentability,
        minInvestment: data.minInvestment,
        maxInvestment: data.maxInvestment || undefined,
        autoReinvestment: data.autoReinvestment,
        totalCapacity: data.totalCapacity || undefined,
        riskLevel: data.riskLevel,
        isActive: data.isActive,
        imageUrl: data.imageUrl || undefined
      };

      await createInvestment(investmentData);
      toast.success('Investment created successfully');
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create investment. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>
            Create a new investment opportunity for users to participate in.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Investment Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Luxembourg Real Estate Fund'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe the investment opportunity...'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='riskLevel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Level *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select risk level' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='LOW'>Low Risk</SelectItem>
                        <SelectItem value='MEDIUM'>Medium Risk</SelectItem>
                        <SelectItem value='HIGH'>High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='duration'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days) *</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='365' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='rentability'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='8.5'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='minInvestment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Investment (€) *</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='1000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='maxInvestment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Investment (€)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='50000'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='totalCapacity'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Total Capacity (€)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Leave empty for unlimited capacity'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='imageUrl'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://example.com/image.jpg'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='autoReinvestment'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Auto-Reinvestment
                      </FormLabel>
                      <div className='text-muted-foreground text-sm'>
                        Allow users to automatically reinvest returns
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Active</FormLabel>
                      <div className='text-muted-foreground text-sm'>
                        Make this investment available to users
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Investment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
