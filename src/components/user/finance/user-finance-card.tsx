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
        <div className='xs:gap-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5'>
          <div className='min-w-0 space-y-1 sm:space-y-2'>
            <div className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Balance
            </div>
            <div className='truncate text-lg font-bold sm:text-2xl'>
              ${balance.toFixed(2)}
            </div>
          </div>

          <div className='min-w-0 space-y-1 sm:space-y-2'>
            <div className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Used Margin
            </div>
            <div className='truncate text-lg font-bold text-orange-600 sm:text-2xl'>
              ${usedMargin.toFixed(2)}
            </div>
          </div>

          <div className='min-w-0 space-y-1 sm:space-y-2'>
            <div className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Equity
            </div>
            <div className='truncate text-lg font-bold text-blue-600 sm:text-2xl'>
              ${calculatedEquity.toFixed(2)}
            </div>
          </div>

          <div className='min-w-0 space-y-1 sm:space-y-2'>
            <div className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Free Margin
            </div>
            <div
              className={`truncate text-lg font-bold sm:text-2xl ${freeMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${freeMargin.toFixed(2)}
            </div>
          </div>

          <div className='col-span-2 min-w-0 space-y-1 sm:col-span-1 sm:space-y-2'>
            <div className='text-muted-foreground text-xs font-medium sm:text-sm'>
              Margin Level
            </div>
            <div
              className={`truncate text-lg font-bold sm:text-2xl ${
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
