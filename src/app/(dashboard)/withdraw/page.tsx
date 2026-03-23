'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  IconBrandPaypal,
  IconBuildingBank,
  IconArrowLeft,
  IconAlertTriangle
} from '@tabler/icons-react';

type WithdrawMethod = 'paypal' | 'bank';

interface BankDetails {
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  bankName: string;
}

interface PaypalDetails {
  email: string;
}

function formatWithdrawDetails(method: string, details: unknown): string {
  if (!details || typeof details !== 'object') return '—';
  const d = details as Record<string, unknown>;
  if (method === 'PAYPAL') {
    const email = d.email;
    return typeof email === 'string' ? email : '—';
  }
  if (method === 'BANK_TRANSFER') {
    const parts: string[] = [];
    if (typeof d.accountHolderName === 'string')
      parts.push(d.accountHolderName);
    if (typeof d.bankName === 'string') parts.push(d.bankName);
    if (typeof d.accountNumber === 'string' && d.accountNumber.length >= 4)
      parts.push(`••••${d.accountNumber.slice(-4)}`);
    if (typeof d.routingNumber === 'string')
      parts.push(`Routing: ${d.routingNumber}`);
    return parts.length ? parts.join(' · ') : '—';
  }
  return '—';
}

export default function WithdrawPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] =
    useState<WithdrawMethod>('paypal');
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Bank details state
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    bankName: ''
  });

  // PayPal details state
  const [paypalDetails, setPaypalDetails] = useState<PaypalDetails>({
    email: ''
  });

  // Withdraw requests (user's history)
  const [requests, setRequests] = useState<
    {
      id: string;
      amount: number;
      method: string;
      status: string;
      createdAt: string;
      details: unknown;
    }[]
  >([]);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/user/withdraw-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch user financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch('/api/user/financial?balanceType=REAL');
        if (response.ok) {
          const data = await response.json();
          // Use freeMargin as the available balance for withdrawal
          setUserBalance(data.freeMargin);
        }
      } catch {
        // Failed to fetch financial data
      }
    };

    if (session?.user) {
      fetchFinancialData();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) loadRequests();
  }, [session?.user, loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);

    if (!amount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (withdrawAmount > userBalance) {
      toast.error('Insufficient funds for this withdrawal.');
      return;
    }

    if (withdrawMethod === 'bank') {
      if (
        !bankDetails.accountNumber ||
        !bankDetails.routingNumber ||
        !bankDetails.accountHolderName ||
        !bankDetails.bankName
      ) {
        toast.error('Please fill in all bank details.');
        return;
      }
    } else if (withdrawMethod === 'paypal') {
      if (!paypalDetails.email) {
        toast.error('Please enter your PayPal email.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const withdrawDetails =
        withdrawMethod === 'paypal'
          ? { email: paypalDetails.email }
          : {
              accountNumber: bankDetails.accountNumber,
              routingNumber: bankDetails.routingNumber,
              accountHolderName: bankDetails.accountHolderName,
              bankName: bankDetails.bankName
            };

      const response = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          withdrawMethod,
          balanceType: 'REAL',
          withdrawDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          'Withdrawal request submitted. You will be notified when it is processed.'
        );

        // Reset form
        setAmount('');
        setBankDetails({
          accountNumber: '',
          routingNumber: '',
          accountHolderName: '',
          bankName: ''
        });
        setPaypalDetails({ email: '' });

        // Update local balance and refresh requests table
        setUserBalance(data.newBalance);
        loadRequests();
      } else {
        toast.error(
          data.error || 'Failed to process withdrawal. Please try again.'
        );
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='container mx-auto max-w-2xl py-6'>
        <div className='mb-6'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-4'
          >
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <h1 className='text-3xl font-bold'>Withdraw Funds</h1>
          <p className='text-muted-foreground'>
            Withdraw money from your trading account
          </p>
        </div>

        {/* Balance Display */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>
                  Available Balance
                </p>
                <p className='text-2xl font-bold'>${userBalance.toFixed(2)}</p>
              </div>
              <IconBuildingBank className='text-muted-foreground h-8 w-8' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
            <CardDescription>
              Enter the amount you want to withdraw and choose your withdrawal
              method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Amount Input */}
              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount (USD)</Label>
                <Input
                  id='amount'
                  type='number'
                  placeholder='0.00'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min='0'
                  max={userBalance}
                  step='0.01'
                  className='text-lg'
                />
                {parseFloat(amount) > userBalance && (
                  <div className='flex items-center space-x-2 text-sm text-red-600'>
                    <IconAlertTriangle className='h-4 w-4' />
                    <span>Amount exceeds available balance</span>
                  </div>
                )}
              </div>

              {/* Withdrawal Method Selection */}
              <div className='space-y-4'>
                <Label>Withdrawal Method</Label>
                <RadioGroup
                  value={withdrawMethod}
                  onValueChange={(value) =>
                    setWithdrawMethod(value as WithdrawMethod)
                  }
                  className='grid grid-cols-2 gap-4'
                >
                  <div className='hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded-lg border p-4'>
                    <RadioGroupItem value='paypal' id='paypal' />
                    <Label
                      htmlFor='paypal'
                      className='flex flex-1 cursor-pointer items-center'
                    >
                      <IconBrandPaypal className='mr-2 h-5 w-5' />
                      PayPal
                    </Label>
                  </div>
                  <div className='hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded-lg border p-4'>
                    <RadioGroupItem value='bank' id='bank' />
                    <Label
                      htmlFor='bank'
                      className='flex flex-1 cursor-pointer items-center'
                    >
                      <IconBuildingBank className='mr-2 h-5 w-5' />
                      Bank Account
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Withdrawal Details */}
              {withdrawMethod === 'paypal' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>PayPal Details</h3>
                  <div className='space-y-2'>
                    <Label htmlFor='paypalEmail'>PayPal Email</Label>
                    <Input
                      id='paypalEmail'
                      type='email'
                      placeholder='your.email@example.com'
                      value={paypalDetails.email}
                      onChange={(e) =>
                        setPaypalDetails((prev) => ({
                          ...prev,
                          email: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {withdrawMethod === 'bank' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>
                    Bank Account Details
                  </h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='accountHolderName'>
                        Account Holder Name
                      </Label>
                      <Input
                        id='accountHolderName'
                        placeholder='John Doe'
                        value={bankDetails.accountHolderName}
                        onChange={(e) =>
                          setBankDetails((prev) => ({
                            ...prev,
                            accountHolderName: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='bankName'>Bank Name</Label>
                      <Input
                        id='bankName'
                        placeholder='Bank of America'
                        value={bankDetails.bankName}
                        onChange={(e) =>
                          setBankDetails((prev) => ({
                            ...prev,
                            bankName: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='accountNumber'>Account Number</Label>
                        <Input
                          id='accountNumber'
                          placeholder='1234567890'
                          value={bankDetails.accountNumber}
                          onChange={(e) =>
                            setBankDetails((prev) => ({
                              ...prev,
                              accountNumber: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='routingNumber'>Routing Number</Label>
                        <Input
                          id='routingNumber'
                          placeholder='021000021'
                          value={bankDetails.routingNumber}
                          onChange={(e) =>
                            setBankDetails((prev) => ({
                              ...prev,
                              routingNumber: e.target.value
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Notice */}
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                <div className='flex items-start space-x-2'>
                  <IconAlertTriangle className='mt-0.5 h-5 w-5 text-blue-600' />
                  <div className='text-sm text-blue-800'>
                    <p className='font-medium'>Withdrawal request</p>
                    <p>
                      Your request will be reviewed by our team. You will be
                      notified when it is processed.{' '}
                      {withdrawMethod === 'paypal'
                        ? 'PayPal typically 1-2 business days.'
                        : 'Bank transfer typically 3-5 business days.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full'
                size='lg'
                disabled={
                  isLoading || parseFloat(amount) > userBalance || !amount
                }
              >
                {isLoading
                  ? 'Submitting...'
                  : `Submit request $${amount || '0.00'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdraw requests table */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Your withdrawal requests</CardTitle>
            <CardDescription>
              Status: Pending (under review), Processing, Approved (completed),
              or Rejected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className='text-muted-foreground py-4 text-center text-sm'>
                No withdrawal requests yet.
              </p>
            ) : (
              <div className='overflow-x-auto rounded-md border'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/50 border-b'>
                      <th className='px-4 py-2 text-left font-medium'>Date</th>
                      <th className='px-4 py-2 text-left font-medium'>
                        Amount
                      </th>
                      <th className='px-4 py-2 text-left font-medium'>
                        Method
                      </th>
                      <th className='px-4 py-2 text-left font-medium'>
                        Details
                      </th>
                      <th className='px-4 py-2 text-left font-medium'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className='border-b last:border-0'>
                        <td className='text-muted-foreground px-4 py-2'>
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className='px-4 py-2 font-medium'>
                          ${r.amount.toFixed(2)}
                        </td>
                        <td className='px-4 py-2'>
                          {r.method === 'PAYPAL' ? 'PayPal' : 'Bank transfer'}
                        </td>
                        <td
                          className='text-muted-foreground max-w-[200px] truncate px-4 py-2 text-xs'
                          title={formatWithdrawDetails(r.method, r.details)}
                        >
                          {formatWithdrawDetails(r.method, r.details)}
                        </td>
                        <td className='px-4 py-2'>
                          <span
                            className={
                              r.status === 'REJECTED'
                                ? 'text-destructive'
                                : r.status === 'APPROVED'
                                  ? 'text-green-600'
                                  : ''
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
