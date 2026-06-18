import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';
import { getPublicAppName } from '@/lib/public-app-name';
import type { Metadata } from 'next';

const APP_NAME = getPublicAppName();

export const metadata: Metadata = {
  title: `${APP_NAME} Dashboard`,
  description: 'Trading platform for trading and investing'
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
