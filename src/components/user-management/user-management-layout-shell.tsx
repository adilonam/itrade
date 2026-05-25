'use client';

import { useLocale } from 'next-intl';
import { UserManagementSidebar } from './user-management-sidebar';

export function UserManagementLayoutShell({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="trade-room flex h-dvh min-h-0 w-full min-w-0 items-stretch overflow-hidden bg-[var(--trade-dark)] text-[var(--trade-text)]"
    >
      <UserManagementSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
