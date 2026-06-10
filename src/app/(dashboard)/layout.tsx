import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';
import type { Metadata } from 'next';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Next Shadcn';

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
