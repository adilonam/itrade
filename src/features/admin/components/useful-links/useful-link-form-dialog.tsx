'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IconLoader2 } from '@tabler/icons-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Valid URL is required'),
  order: z.coerce.number().int().min(0, 'Order must be 0 or more')
});

type FormData = z.infer<typeof formSchema>;

export type UsefulLinkRow = {
  id: string;
  title: string;
  url: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

interface UsefulLinkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLink: UsefulLinkRow | null;
  onSuccess: () => void;
}

export function UsefulLinkFormDialog({
  open,
  onOpenChange,
  editLink,
  onSuccess
}: UsefulLinkFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      order: 0
    }
  });

  useEffect(() => {
    if (open) {
      if (editLink) {
        form.reset({
          title: editLink.title,
          url: editLink.url,
          order: editLink.order
        });
      } else {
        form.reset({ title: '', url: '', order: 0 });
      }
    }
  }, [open, editLink, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      if (editLink) {
        const res = await fetch(`/api/admin/useful-links/${editLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Update failed');
        }
        toast.success('Link updated');
      } else {
        const res = await fetch('/api/admin/useful-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? 'Create failed');
        }
        toast.success('Link created');
      }
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {editLink ? 'Edit useful link' : 'Add useful link'}
          </DialogTitle>
          <DialogDescription>
            {editLink
              ? 'Update the title, URL, or display order.'
              : 'Add a new link to show on the useful links page.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Support' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='order'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input type='number' min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? (
                  <>
                    <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : editLink ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
