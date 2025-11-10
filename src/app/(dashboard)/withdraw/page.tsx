'use client';

import { useState, useEffect } from 'react';
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
import { Icons } from '@/components/icons';
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

  // Fetch user financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch('/api/user/financial');
        if (response.ok) {
          const data = await response.json();
          // Use freeMargin as the available balance for withdrawal
          setUserBalance(data.freeMargin);
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      }
    };

    if (session?.user) {
      fetchFinancialData();
    }
  }, [session]);

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
          withdrawDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Withdrawal successful! Your new balance is $${data.newBalance.toFixed(2)}.`
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

        // Update local balance
        setUserBalance(data.newBalance);

        // Redirect to dashboard or transactions page
        router.push('/dashboard/overview');
      } else {
        toast.error(
          data.error || 'Failed to process withdrawal. Please try again.'
        );
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
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
                    <p className='font-medium'>Processing Time</p>
                    <p>
                      {withdrawMethod === 'paypal'
                        ? 'PayPal withdrawals typically process within 1-2 business days.'
                        : 'Bank transfers typically process within 3-5 business days.'}
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
                {isLoading ? 'Processing...' : `Withdraw $${amount || '0.00'}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
