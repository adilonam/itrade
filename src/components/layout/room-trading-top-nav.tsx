'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { tenantNavItems } from '@/constants/data';

export function RoomTradingTopNav() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role as
    | 'USER'
    | 'SELLER'
    | 'ADMIN'
    | 'SUPERADMIN'
    | undefined;
  const roomTradingNav =
    tenantNavItems['Room Trading']?.[userRole ?? 'USER'] ??
    tenantNavItems['Room Trading']?.USER ??
    [];
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      <div
        role="tablist"
        className="inline-flex h-9 w-fit items-center justify-center gap-0.5 rounded-lg border border-border bg-muted/60 p-1 dark:bg-muted/40"
      >
        {roomTradingNav.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url.startsWith('/transactions') &&
              pathname?.startsWith('/transactions')) ||
            (item.url === '/trade' && pathname?.startsWith('/trade')) ||
            (item.url.startsWith('/admin') && pathname?.startsWith(item.url)) ||
            (item.url.startsWith('/super-admin') &&
              pathname?.startsWith(item.url));

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                'rounded-md border-0 px-3 py-1.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
