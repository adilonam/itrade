'use client';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SessionProvider>{children}</SessionProvider>
      </ActiveThemeProvider>
    </>
  );
}
