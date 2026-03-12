'use client';

import { usePathname } from 'next/navigation';
import AppSidebar from './app-sidebar';
import Header from './header';
import { RoomTradingTopNav } from './room-trading-top-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MarketsWebSocketProvider } from '@/contexts/markets-websocket-context';
import KBar from '@/components/kbar';

const ROOM_TRADING_PATHS = [
  '/markets-room-trading',
  '/positions-room-trading',
  '/trading-view-room-trading',
  '/overview-test',
  '/news',
  '/withdraw',
  '/deposit',
  '/profile',
  '/transactions'
];

function isRoomTradingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return ROOM_TRADING_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export function DashboardLayoutClient({
  children,
  defaultOpen
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const pathname = usePathname();
  const useTopNav = isRoomTradingPath(pathname);

  if (useTopNav) {
    return (
      <KBar>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full flex-col">
            <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
              <RoomTradingTopNav />
              <Header variant="compact" />
            </header>
            <main className="flex min-h-0 flex-1 flex-col overflow-auto">
              <MarketsWebSocketProvider>{children}</MarketsWebSocketProvider>
            </main>
          </div>
        </SidebarProvider>
      </KBar>
    );
  }

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <MarketsWebSocketProvider>{children}</MarketsWebSocketProvider>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
