'use client';

import { LanguageMenu } from '@/components/i18n/language-menu';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';

type UserManagementPageHeaderProps = {
  title: string;
  description?: string;
  /** Use compact h-14 bar (dashboard). Default is taller header with optional description. */
  compact?: boolean;
};

export function UserManagementPageHeader({
  title,
  description,
  compact = false
}: UserManagementPageHeaderProps) {
  if (compact) {
    return (
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageMenu variant="trade" />
          <ModeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[var(--trade-text)]">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--trade-text-muted)]">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageMenu variant="trade" />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
