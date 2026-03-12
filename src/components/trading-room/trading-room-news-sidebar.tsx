'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOCK_NEWS } from './mock-data';
import { IconNews, IconCalendar, IconChartBar } from '@tabler/icons-react';

export function TradingRoomNewsSidebar() {
  const [activeTab, setActiveTab] = useState<'news' | 'calendar' | 'market'>('news');

  return (
    <aside className="flex h-full min-w-0 flex-1 flex-col border-l border-[var(--trade-border)] bg-[var(--trade-panel)]">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center border-b border-[var(--trade-border)]">
          <TabsList className="h-full w-full justify-stretch rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="news"
              className="flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent bg-transparent text-xs font-medium text-[var(--trade-text-muted)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-white"
            >
              <IconNews className="size-3" />
              News
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent bg-transparent text-xs font-medium text-[var(--trade-text-muted)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-white"
            >
              <IconCalendar className="size-3" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent bg-transparent text-xs font-medium text-[var(--trade-text-muted)] data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-white"
            >
              <IconChartBar className="size-3" />
              Market
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="news" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 border-t border-[var(--trade-border)] p-4">
              {MOCK_NEWS.map((item) => (
                <div key={item.id} className="group cursor-pointer space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-[10px] font-bold uppercase text-[var(--trade-text-muted)] transition-colors group-hover:text-[var(--trade-accent-blue)]">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--trade-text-muted)]">{item.time}</span>
                  </div>
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-[var(--trade-text-muted)]">{item.title}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="calendar" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden">
          <p className="text-center text-sm text-[var(--trade-text-muted)]">No calendar events</p>
        </TabsContent>
        <TabsContent value="market" className="mt-0 flex flex-1 items-center justify-center data-[state=inactive]:hidden">
          <p className="text-center text-sm text-[var(--trade-text-muted)]">Market overview</p>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
