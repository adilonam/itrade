'use client';

import { useState } from 'react';
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
  IconCreditCard,
  IconBrandPaypal,
  IconArrowLeft
} from '@tabler/icons-react';

type PaymentMethod = 'card' | 'paypal';

interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface PaypalDetails {
  email: string;
}

export default function DepositPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState(false);

  // Card details state
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // PayPal details state
  const [paypalDetails, setPaypalDetails] = useState<PaypalDetails>({
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (paymentMethod === 'card') {
      if (
        !cardDetails.cardNumber ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv ||
        !cardDetails.cardholderName
      ) {
        toast.error('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'paypal') {
      if (!paypalDetails.email) {
        toast.error('Please enter your PayPal email');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          paymentDetails: paymentMethod === 'card' ? cardDetails : paypalDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Deposit successful! Your new balance is $${data.newBalance.toFixed(2)}.`
        );

        // Reset form
        setAmount('');
        setCardDetails({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        });
        setPaypalDetails({ email: '' });

        router.push('/dashboard/overview');
      } else {
        toast.error(
          data.error || 'Failed to process deposit. Please try again.'
        );
      }
    } catch (error) {
      console.error('Deposit error:', error);
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
          <h1 className='text-3xl font-bold'>Deposit Funds</h1>
          <p className='text-muted-foreground'>
            Add money to your trading account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Amount</CardTitle>
            <CardDescription>
              Enter the amount you want to deposit and choose your payment
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
                  step='0.01'
                  className='text-lg'
                />
              </div>

              {/* Payment Method Selection */}
              <div className='space-y-4'>
                <Label>Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                  className='grid grid-cols-2 gap-4'
                >
                  <div className='hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded-lg border p-4'>
                    <RadioGroupItem value='card' id='card' />
                    <Label
                      htmlFor='card'
                      className='flex flex-1 cursor-pointer items-center'
                    >
                      <IconCreditCard className='mr-2 h-5 w-5' />
                      Credit/Debit Card
                    </Label>
                  </div>
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
                </RadioGroup>
              </div>

              {/* Payment Details */}
              {paymentMethod === 'card' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Card Details</h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='cardholderName'>Cardholder Name</Label>
                      <Input
                        id='cardholderName'
                        placeholder='John Doe'
                        value={cardDetails.cardholderName}
                        onChange={(e) =>
                          setCardDetails((prev) => ({
                            ...prev,
                            cardholderName: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='cardNumber'>Card Number</Label>
                      <Input
                        id='cardNumber'
                        placeholder='1234 5678 9012 3456'
                        value={cardDetails.cardNumber}
                        onChange={(e) =>
                          setCardDetails((prev) => ({
                            ...prev,
                            cardNumber: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='expiryDate'>Expiry Date</Label>
                        <Input
                          id='expiryDate'
                          placeholder='MM/YY'
                          value={cardDetails.expiryDate}
                          onChange={(e) =>
                            setCardDetails((prev) => ({
                              ...prev,
                              expiryDate: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='cvv'>CVV</Label>
                        <Input
                          id='cvv'
                          placeholder='123'
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails((prev) => ({
                              ...prev,
                              cvv: e.target.value
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
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

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full'
                size='lg'
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `Deposit $${amount || '0.00'}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
