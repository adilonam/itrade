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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  createUser,
  updateUser,
  type CreateUserData,
  type UpdateUserData,
  type UserWithBalances
} from '../services/users';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SellerUsersSection from './seller-users-section';
import { AdminUserKycPositionsSection } from './admin-user-kyc-positions-section';
import { DEFAULT_DEMO_BALANCE_AMOUNT } from '@/lib/balance';

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
  role: z.enum(['USER', 'SELLER', 'ADMIN', 'SUPERADMIN'], {
    required_error: 'Please select a role.'
  }),
  realBalance: z
    .number()
    .min(0, {
      message: 'Real balance cannot be negative.'
    })
    .optional()
    .default(0),
  demoBalance: z
    .number()
    .min(0, {
      message: 'Demo balance cannot be negative.'
    })
    .optional()
    .default(DEFAULT_DEMO_BALANCE_AMOUNT),
  leverage: z
    .number()
    .min(1, {
      message: 'Leverage must be at least 1.'
    })
    .optional()
    .default(1),
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
  role: z.enum(['USER', 'SELLER', 'ADMIN', 'SUPERADMIN'], {
    required_error: 'Please select a role.'
  }),
  realBalance: z
    .number()
    .min(0, {
      message: 'Real balance cannot be negative.'
    })
    .optional(),
  demoBalance: z
    .number()
    .min(0, {
      message: 'Demo balance cannot be negative.'
    })
    .optional(),
  leverage: z
    .number()
    .min(1, {
      message: 'Leverage must be at least 1.'
    })
    .optional(),
  emailVerified: z.boolean().optional()
});

export default function UserForm({
  initialData,
  pageTitle
}: {
  initialData: UserWithBalances | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(
    initialData?.role || null
  );
  const isEdit = !!initialData;

  const formSchema = isEdit ? updateFormSchema : createFormSchema;

  const defaultValues = {
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ('USER' as const),
    realBalance: initialData?.realBalance ?? initialData?.balance ?? 0,
    demoBalance: initialData?.demoBalance ?? DEFAULT_DEMO_BALANCE_AMOUNT,
    leverage: initialData?.leverage || 1,
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
        const updateData: UpdateUserData = {
          name: values.name,
          email: values.email,
          role: values.role,
          realBalance: values.realBalance,
          demoBalance: values.demoBalance,
          leverage: values.leverage,
          emailVerified: values.emailVerified ? new Date() : null
        };
        if (values.password) {
          updateData.password = values.password;
        }

        await updateUser(initialData.id, updateData);
        toast.success('User updated successfully');
      } else {
        // Create user
        if (!values.password) {
          toast.error('Password is required for new users');
          return;
        }
        const createData: CreateUserData = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          balance: values.realBalance ?? 0,
          realBalance: values.realBalance ?? 0,
          demoBalance: values.demoBalance,
          leverage: values.leverage,
          emailVerified: values.emailVerified ? new Date() : null
        };

        await createUser(createData);
        toast.success('User created successfully');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='mx-auto w-full space-y-6'>
      <Card className='w-full'>
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        setCurrentRole(value);
                      }}
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
                        <SelectItem value='SELLER'>Seller</SelectItem>
                        <SelectItem value='ADMIN'>Admin</SelectItem>
                        <SelectItem value='SUPERADMIN'>Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='realBalance'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Real Balance</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter real balance'
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
                      Live trading account balance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='demoBalance'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demo Balance</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter demo balance'
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
                      Practice account balance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='leverage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trading Leverage</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter leverage (e.g., 100)'
                        type='number'
                        min='1'
                        disabled={loading}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Set the trading leverage multiplier (1:1, 10:1, 100:1,
                      etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* Seller Users Management Section - Only show when editing a seller */}
            {isEdit &&
              initialData &&
              (currentRole === 'SELLER' || initialData.role === 'SELLER') && (
                <SellerUsersSection sellerId={initialData.id} />
              )}

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

      {isEdit && initialData ? (
        <AdminUserKycPositionsSection
          userId={initialData.id}
          kycStatus={initialData.kycStatus}
        />
      ) : null}
    </div>
  );
}
