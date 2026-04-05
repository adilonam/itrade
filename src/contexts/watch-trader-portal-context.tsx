'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from 'react';
import { cn } from '@/lib/utils';

const WatchTraderPortalContext = createContext<HTMLDivElement | null>(null);

export function WatchTraderShellWithPortal({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const [shell, setShell] = useState<HTMLDivElement | null>(null);
  return (
    <WatchTraderPortalContext.Provider value={shell}>
      <div ref={setShell} className={cn(className)}>
        {children}
      </div>
    </WatchTraderPortalContext.Provider>
  );
}

export function useWatchTraderPortalContainer() {
  return useContext(WatchTraderPortalContext);
}
