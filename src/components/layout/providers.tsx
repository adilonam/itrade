'use client';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { ConsentGateProvider } from '@/components/consent/consent-gate-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          <ConsentGateProvider>{children}</ConsentGateProvider>
        </ActiveThemeProvider>
      </SessionProvider>
    </>
  );
}
