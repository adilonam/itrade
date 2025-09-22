'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconShieldX, IconHome, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface ForbiddenPageProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function ForbiddenPage({
  title = 'Access Denied',
  description = 'You do not have permission to access this page. Contact your administrator if you believe this is an error.',
  showBackButton = true,
  showHomeButton = true
}: ForbiddenPageProps) {
  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='pb-6 text-center'>
          <div className='bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <IconShieldX className='text-destructive h-8 w-8' />
          </div>
          <CardTitle className='text-2xl font-bold'>403</CardTitle>
          <CardTitle className='text-xl'>{title}</CardTitle>
          <CardDescription className='text-center'>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
            {showBackButton && (
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => window.history.back()}
              >
                <IconArrowLeft className='mr-2 h-4 w-4' />
                Go Back
              </Button>
            )}
            {showHomeButton && (
              <Button asChild className='flex-1'>
                <Link href='/dashboard'>
                  <IconHome className='mr-2 h-4 w-4' />
                  Dashboard
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
