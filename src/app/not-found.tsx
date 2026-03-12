'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconFileX, IconHome, IconArrowLeft } from '@tabler/icons-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='pb-6 text-center'>
          <div className='bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <IconFileX className='text-muted-foreground h-8 w-8' />
          </div>
          <CardTitle className='text-2xl font-bold'>404</CardTitle>
          <CardTitle className='text-xl'>Something&apos;s missing</CardTitle>
          <CardDescription className='text-center'>
            Sorry, the page you are looking for doesn&apos;t exist or has been
            moved.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => router.back()}
            >
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
            <Button onClick={() => router.push('/trade')} className='flex-1'>
              <IconHome className='mr-2 h-4 w-4' />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
