'use client';

import { LanguageMenu } from '@/components/i18n/language-menu';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserManagementSidebar } from '@/components/user-management/user-management-sidebar-context';
import { IconMenu2 } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

type UserManagementPageHeaderProps = {
  title: string;
  description?: string;
  /** Use compact h-14 bar (dashboard). Default is taller header with optional description. */
  compact?: boolean;
};

function SidebarToggleButton() {
  const isMobile = useIsMobile();
  const { toggleMobileSidebar } = useUserManagementSidebar();
  const tSidebar = useTranslations('UserManagement.sidebar');

  if (!isMobile) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleMobileSidebar}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--trade-text)] transition-colors hover:bg-[var(--trade-border)]/40"
      aria-label={tSidebar('toggle')}
    >
      <IconMenu2 className="size-5 stroke-[1.75]" stroke={1.75} />
    </button>
  );
}

function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <LanguageMenu variant="trade" />
      <ModeToggle />
    </div>
  );
}

export function UserManagementPageHeader({
  title,
  description,
  compact = false
}: UserManagementPageHeaderProps) {
  if (compact) {
    return (
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarToggleButton />
          <h1 className="truncate text-base font-semibold text-[var(--trade-text)]">
            {title}
          </h1>
        </div>
        <HeaderActions />
      </header>
    );
  }

  return (
    <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-4 py-4 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <SidebarToggleButton />
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-[var(--trade-text)]">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-[var(--trade-text-muted)]">{description}</p>
            ) : null}
          </div>
        </div>
        <HeaderActions />
      </div>
    </header>
  );
}
