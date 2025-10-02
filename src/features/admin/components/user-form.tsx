'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
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
import { User } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createUser, updateUser } from '../services/users';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const createFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.'
  }),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN'], {
    required_error: 'Please select a role.'
  }),
  balance: z
    .number()
    .min(0, {
      message: 'Balance cannot be negative.'
    })
    .optional()
    .default(0),
  emailVerified: z.boolean().optional()
});

const updateFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  password: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters.'
    })
    .optional()
    .or(z.literal('')),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN'], {
    required_error: 'Please select a role.'
  }),
  balance: z
    .number()
    .min(0, {
      message: 'Balance cannot be negative.'
    })
    .optional(),
  emailVerified: z.boolean().optional()
});

export default function UserForm({
  initialData,
  pageTitle
}: {
  initialData: User | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  const formSchema = isEdit ? updateFormSchema : createFormSchema;

  const defaultValues = {
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ('USER' as const),
    balance: initialData?.balance || 0,
    emailVerified: !!initialData?.emailVerified
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      if (isEdit && initialData) {
        // Update user - remove password if empty and handle email verification
        const updateData: any = { ...values };
        if (!updateData.password || updateData.password === '') {
          delete updateData.password;
        }
        // Convert emailVerified boolean to Date or null
        updateData.emailVerified = updateData.emailVerified ? new Date() : null;

        await updateUser(initialData.id, updateData);
        toast.success('User updated successfully');
      } else {
        // Create user
        if (!values.password) {
          toast.error('Password is required for new users');
          return;
        }
        const createData: any = { ...values };
        // Convert emailVerified boolean to Date or null for new users
        createData.emailVerified = createData.emailVerified ? new Date() : null;

        await createUser(createData);
        toast.success('User created successfully');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter full name'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter email address'
                        type='email'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password {isEdit && '(leave empty to keep current)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isEdit ? 'Enter new password' : 'Enter password'
                        }
                        type='password'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='USER'>User</SelectItem>
                        <SelectItem value='ADMIN'>Admin</SelectItem>
                        <SelectItem value='SUPERADMIN'>Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='balance'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Balance</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter account balance'
                      type='number'
                      step='0.01'
                      min='0'
                      disabled={loading}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Set the initial account balance for this user
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='emailVerified'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Email Verification
                    </FormLabel>
                    <FormDescription>
                      Mark this user&apos;s email as verified
                    </FormDescription>
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

            <div className='flex items-center gap-2'>
              <Button
                type='submit'
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/admin/users')}
                disabled={loading}
                className='w-full md:w-auto'
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
