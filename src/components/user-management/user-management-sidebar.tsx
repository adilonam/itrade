'use client';

import { usePublicAppName } from '@/hooks/use-public-app-name';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconArrowDownLeft,
  IconLayoutGrid,
  IconPlus,
  IconSettings,
  IconShield
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  brandLogoSrc,
  userManagementNavPrimary,
  userManagementNavSecondary,
  type UserManagementNavItem
} from '@/constants/data';
import { useTranslations } from 'next-intl';
import { userManagementNavTitleKey } from '@/lib/user-management-nav-i18n';

const iconByUrl: Record<
  string,
  React.ComponentType<{ className?: string; stroke?: number }>
> = {
  '/user-management': IconLayoutGrid,
  '/user-management/deposit': IconPlus,
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
  active,
  label,
  onNavigate
}: {
  item: UserManagementNavItem;
  active: boolean;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = iconByUrl[item.url] ?? IconLayoutGrid;
  return (
    <Link
      href={item.url}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--trade-border)]/80 text-[var(--trade-accent-blue)]'
          : 'text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40'
      )}
    >
      <Icon className='size-5 shrink-0 stroke-[1.75]' stroke={1.75} />
      <span className='truncate'>{label}</span>
    </Link>
  );
}

type UserManagementSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function UserManagementSidebar({
  className,
  onNavigate
}: UserManagementSidebarProps = {}) {
  const pathname = usePathname() ?? '';
  const checkActive = isActive(pathname);
  const appName = usePublicAppName();
  const tNav = useTranslations('UserManagement.nav');
  const tSidebar = useTranslations('UserManagement.sidebar');

  const navLabel = (title: string) => {
    const key = userManagementNavTitleKey(title);
    return key ? tNav(key) : title;
  };

  return (
    <aside
      className={cn(
        'flex min-h-0 w-[260px] shrink-0 flex-col self-stretch border-r border-[var(--trade-border)] bg-[var(--trade-panel)]',
        className
      )}
    >
      <Link
        href='/trade'
        className='flex h-14 shrink-0 items-center border-b border-[var(--trade-border)] px-4 transition-colors hover:bg-[var(--trade-border)]/30'
        aria-label={`Go to trade, ${appName}`}
      >
        <span className='relative flex h-10 shrink-0 items-center'>
          <Image
            src={brandLogoSrc}
            alt=''
            width={200}
            height={48}
            className='h-10 max-h-10 w-auto'
            priority
          />
        </span>
      </Link>
      <nav
        className='flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 text-[var(--trade-text)]'
        aria-label={tSidebar('ariaLabel')}
      >
        <div className='flex flex-col gap-0.5'>
          {userManagementNavPrimary.map((item) => (
            <NavRow
              key={item.url}
              item={item}
              active={checkActive(item)}
              label={navLabel(item.title)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {userManagementNavSecondary.length > 0 ? (
          <>
            <div
              className='my-3 h-px shrink-0 bg-[var(--trade-border)]'
              role='separator'
            />
            <div className='flex flex-col gap-0.5'>
              {userManagementNavSecondary.map((item) => (
                <NavRow
                  key={item.url}
                  item={item}
                  active={checkActive(item)}
                  label={navLabel(item.title)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
