'use client';

import { useLocale } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import { UserManagementSidebar } from './user-management-sidebar';
import {
  UserManagementSidebarProvider,
  useUserManagementSidebar
} from './user-management-sidebar-context';

function UserManagementLayoutInner({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const isMobile = useIsMobile();
  const isRtl = locale === 'ar';
  const { mobileOpen, setMobileOpen } = useUserManagementSidebar();
  const tSidebar = useTranslations('UserManagement.sidebar');

  const closeMobileSidebar = () => setMobileOpen(false);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="trade-room flex h-dvh min-h-0 w-full min-w-0 items-stretch overflow-hidden bg-[var(--trade-dark)] text-[var(--trade-text)]"
    >
      {!isMobile ? <UserManagementSidebar /> : null}

      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side={isRtl ? 'right' : 'left'}
            className="trade-room w-[min(100vw,280px)] max-w-[85vw] border-[var(--trade-border)] bg-[var(--trade-select-menu)] p-0 text-[var(--trade-text)] opacity-100 [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{tSidebar('ariaLabel')}</SheetTitle>
              <SheetDescription>{tSidebar('mobileDescription')}</SheetDescription>
            </SheetHeader>
            <UserManagementSidebar
              className="h-full w-full border-0 bg-[var(--trade-select-menu)]"
              onNavigate={closeMobileSidebar}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function UserManagementLayoutShell({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserManagementSidebarProvider>
      <UserManagementLayoutInner>{children}</UserManagementLayoutInner>
    </UserManagementSidebarProvider>
  );
}
