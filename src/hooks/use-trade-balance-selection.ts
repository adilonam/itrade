'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TRADE_BALANCE_CHANGE_EVENT,
  TradeBalanceType,
  broadcastTradeBalanceTypeChange,
  getStoredTradeBalanceType,
  parseTradeBalanceType,
  persistTradeBalanceTypeLocal
} from '@/lib/balance-selection';

type TradeBalanceChangeEvent = CustomEvent<{ balanceType: TradeBalanceType }>;

export function useTradeBalanceSelection() {
  const [selectedBalanceType, setSelectedBalanceType] =
    useState<TradeBalanceType>('REAL');

  useEffect(() => {
    const localValue = getStoredTradeBalanceType();
    if (localValue) {
      setSelectedBalanceType(localValue);
    }

    let isMounted = true;
    const loadFromServer = async () => {
      try {
        const response = await fetch('/api/user/balance-selection', {
          cache: 'no-store'
        });
        if (!response.ok) return;
        const payload = await response.json();
        const nextType = parseTradeBalanceType(payload?.balanceType);
        if (!isMounted) return;
        setSelectedBalanceType(nextType);
        persistTradeBalanceTypeLocal(nextType);
      } catch {
        // Best effort only.
      }
    };

    void loadFromServer();

    const onBalanceTypeChange = (event: Event) => {
      const customEvent = event as TradeBalanceChangeEvent;
      const nextType = parseTradeBalanceType(customEvent.detail?.balanceType);
      setSelectedBalanceType(nextType);
      persistTradeBalanceTypeLocal(nextType);
    };

    window.addEventListener(TRADE_BALANCE_CHANGE_EVENT, onBalanceTypeChange);

    return () => {
      isMounted = false;
      window.removeEventListener(
        TRADE_BALANCE_CHANGE_EVENT,
        onBalanceTypeChange
      );
    };
  }, []);

  const setTradeBalanceType = useCallback(
    async (nextType: TradeBalanceType) => {
      const normalized = parseTradeBalanceType(nextType);
      setSelectedBalanceType(normalized);
      persistTradeBalanceTypeLocal(normalized);
      broadcastTradeBalanceTypeChange(normalized);

      try {
        await fetch('/api/user/balance-selection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ balanceType: normalized })
        });
      } catch {
        // Best effort only.
      }
    },
    []
  );

  return {
    selectedBalanceType,
    setTradeBalanceType
  };
}
