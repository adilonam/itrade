'use client';

import { UserRoomPositionsTabsPanel } from '@/components/user/positions/user-room-positions-tabs-panel';

export function TradingRoomPositionsPanel() {
  return (
    <UserRoomPositionsTabsPanel
      layout="trade-panel"
      room="TRADING"
      refreshEventName="room-trading-positions-refresh"
    />
  );
}
