'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconLoader2 } from '@tabler/icons-react';

export type UserInvestmentWithRelations = {
  id: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  expectedReturn: number;
  actualReturn: number | null;
  autoReinvest: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  investment: {
    id: string;
    title: string;
    duration: number;
    rentability: number;
    riskLevel: string;
  };
};

interface SellerInvestmentsTableProps {
  userInvestments: UserInvestmentWithRelations[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function SellerInvestmentsTable({
  userInvestments,
  loading,
  pagination,
  onPageChange
}: SellerInvestmentsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <IconLoader2 className='h-6 w-6 animate-spin' />
          <span className='ml-2'>Loading investments...</span>
        </CardContent>
      </Card>
    );
  }

  if (userInvestments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User investments</CardTitle>
          <CardDescription>
            Investments of your linked users will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No investments found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              User enrollments in investment products will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User investments ({pagination.total})</CardTitle>
        <CardDescription>
          Manage investments of your linked users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative flex min-h-[400px] flex-col'>
          <div className='flex flex-1 flex-col space-y-4'>
            <div className='relative flex flex-1'>
              <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
                <ScrollArea className='h-full w-full' horizontal>
                  <Table>
                    <TableHeader className='bg-muted sticky top-0 z-10'>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Investment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Expected return</TableHead>
                        <TableHead>Actual return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userInvestments.map((ui) => (
                        <TableRow key={ui.id}>
                          <TableCell>
                            <div>
                              <div className='font-medium'>
                                {ui.user.name || 'No Name'}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {ui.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className='font-medium'>
                                {ui.investment.title}
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {ui.investment.duration} mo ·{' '}
                                {ui.investment.rentability}% ·{' '}
                                {ui.investment.riskLevel}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {formatCurrency(ui.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(ui.status)}
                              className='text-xs'
                            >
                              {ui.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-muted-foreground text-xs'>
                            {formatDate(ui.startDate)}
                          </TableCell>
                          <TableCell className='text-muted-foreground text-xs'>
                            {formatDate(ui.endDate)}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {formatCurrency(ui.expectedReturn)}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {ui.actualReturn != null
                              ? formatCurrency(ui.actualReturn)
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>
          {pagination.pages > 1 && (
            <div className='mt-4 flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className='rounded border px-3 py-1 text-sm disabled:opacity-50'
                >
                  Previous
                </button>
                <button
                  type='button'
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className='rounded border px-3 py-1 text-sm disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
