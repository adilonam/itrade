'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';
import { IconDownload, IconFilter } from '@tabler/icons-react';

const GUEST_MSG =
  "You don't have any open positions because you are in guest mode.";

export function TradingRoomBottomPanel({ guestMode = false }: { guestMode?: boolean }) {
  return (
    <div className="flex h-[240px] min-h-0 flex-col border-t border-border bg-background">
      <Tabs defaultValue="open" className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <TabsList className="h-8 gap-0 bg-transparent p-0">
            <TabsTrigger value="open" className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary">Open Positions</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary">Pending Orders</TabsTrigger>
            <TabsTrigger value="closed" className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary">Closed Positions</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary">Finance</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label="Filter"><IconFilter className="size-4" /></button>
            <button type="button" className="rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label="Download"><IconDownload className="size-4" /></button>
          </div>
        </div>
        <TabsContent value="open" className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          {guestMode ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">GUEST MODE</span>
              <p className="text-sm text-muted-foreground">{GUEST_MSG}</p>
            </div>
          ) : (
            <div className="h-full overflow-auto"><UserPositionsTableCardRoomTrading /></div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden"><p className="text-sm text-muted-foreground">No pending orders</p></TabsContent>
        <TabsContent value="closed" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden"><p className="text-sm text-muted-foreground">Closed positions will appear here</p></TabsContent>
        <TabsContent value="finance" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden"><p className="text-sm text-muted-foreground">Deposits and withdrawals</p></TabsContent>
      </Tabs>
    </div>
  );
}
