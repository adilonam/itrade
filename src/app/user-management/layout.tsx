import { UserManagementLayoutShell } from '@/components/user-management/user-management-layout-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'User management'
};

export default function UserManagementLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <UserManagementLayoutShell>{children}</UserManagementLayoutShell>;
}
