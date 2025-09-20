'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export default function Page() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Force light theme for Swagger UI documentation
    setTheme('light');
  }, [setTheme]);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='API Documentation'
            description='Explore and test the API endpoints using our interactive Swagger documentation.'
          />
        </div>
        <Separator />
        <div className='swagger-container'>
          <SwaggerUI url='/api/docs' />
        </div>
      </div>
    </PageContainer>
  );
}
