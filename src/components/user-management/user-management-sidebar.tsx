'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconBolt,
  IconLayoutGrid,
  IconPlus,
  IconSettings,
  IconShield
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  userManagementNavPrimary,
  userManagementNavSecondary,
  type UserManagementNavItem
} from '@/constants/data';

const iconByUrl: Record<
  string,
  React.ComponentType<{ className?: string; stroke?: number }>
> = {
  '/user-management': IconLayoutGrid,
  '/user-management/deposit': IconPlus,
  '/user-management/transfer': IconArrowRight,
  '/user-management/withdrawal': IconArrowDownLeft,
  '/user-management/settings': IconSettings,
  '/user-management/kyc': IconShield
};

function isActive(pathname: string): (item: UserManagementNavItem) => boolean {
  return (item) => {
    if (item.url === '/user-management') {
      return pathname === '/user-management';
    }
    return pathname === item.url || pathname.startsWith(`${item.url}/`);
  };
}

function NavRow({
  item,
  active
}: {
  item: UserManagementNavItem;
  active: boolean;
}) {
  const Icon = iconByUrl[item.url] ?? IconLayoutGrid;
  return (
    <Link
      href={item.url}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--trade-border)]/80 text-[var(--trade-accent-blue)]'
          : 'text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40'
      )}
    >
      <Icon className="size-5 shrink-0 stroke-[1.75]" stroke={1.75} />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export function UserManagementSidebar() {
  const pathname = usePathname() ?? '';
  const checkActive = isActive(pathname);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'PaySnap';

  return (
    <aside className="flex min-h-0 w-[260px] shrink-0 flex-col self-stretch border-r border-[var(--trade-border)] bg-[var(--trade-panel)]">
      <Link
        href="/"
        className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--trade-border)] px-4 transition-colors hover:bg-[var(--trade-border)]/30"
        aria-label="Go to home"
      >
        <span className="flex size-9 items-center justify-center rounded-md bg-[var(--trade-accent-blue)] text-white">
          <IconBolt className="size-5" stroke={2} />
        </span>
        <span className="text-base font-bold tracking-tight text-[var(--trade-text)]">
          {appName}
        </span>
      </Link>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 text-[var(--trade-text)]"
        aria-label="User management"
      >
        <div className="flex flex-col gap-0.5">
          {userManagementNavPrimary.map((item) => (
            <NavRow key={item.url} item={item} active={checkActive(item)} />
          ))}
        </div>
        {userManagementNavSecondary.length > 0 ? (
          <>
            <div
              className="my-3 h-px shrink-0 bg-[var(--trade-border)]"
              role="separator"
            />
            <div className="flex flex-col gap-0.5">
              {userManagementNavSecondary.map((item) => (
                <NavRow key={item.url} item={item} active={checkActive(item)} />
              ))}
            </div>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
