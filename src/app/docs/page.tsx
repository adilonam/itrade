'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import PageContainer from '@/components/layout/page-container';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='API Documentation'
            description='Explore and test the API endpoints using our interactive Swagger documentation.'
          />
          <ModeToggle />
        </div>
        <Separator />
        <div className='swagger-container'>
          <SwaggerUI url='/api/docs' />
        </div>
      </div>
    </PageContainer>
  );
}
