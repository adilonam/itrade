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
        className="inline-flex h-8 w-fit items-center justify-center gap-1 rounded-full bg-muted/50 p-1"
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
                'rounded-full border-0 px-3 py-1.5 text-sm font-medium transition-all duration-200',
                'hover:bg-muted/70',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
