import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface UserFinanceCardProps {
  balance: number;
  usedMargin: number;
  equity?: number;
}

export function UserFinanceCard({
  balance,
  usedMargin,
  equity
}: UserFinanceCardProps) {
  // Calculate financial metrics
  const calculatedEquity = equity ?? balance; // Use provided equity or default to balance
  const freeMargin = calculatedEquity - usedMargin;
  const marginLevel =
    usedMargin > 0 ? (calculatedEquity / usedMargin) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
        <CardDescription>
          Your current financial status and margin information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm font-medium'>
              Balance
            </div>
            <div className='text-2xl font-bold'>${balance.toFixed(2)}</div>
          </div>

          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm font-medium'>
              Used Margin
            </div>
            <div className='text-2xl font-bold text-orange-600'>
              ${usedMargin.toFixed(2)}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm font-medium'>
              Equity
            </div>
            <div className='text-2xl font-bold text-blue-600'>
              ${calculatedEquity.toFixed(2)}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm font-medium'>
              Free Margin
            </div>
            <div
              className={`text-2xl font-bold ${freeMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${freeMargin.toFixed(2)}
            </div>
          </div>

          <div className='space-y-2'>
            <div className='text-muted-foreground text-sm font-medium'>
              Margin Level
            </div>
            <div
              className={`text-2xl font-bold ${
                marginLevel >= 200
                  ? 'text-green-600'
                  : marginLevel >= 100
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {marginLevel.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
