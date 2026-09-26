import { cookies } from 'next/headers';

import {
  TRADE_BALANCE_COOKIE,
  parseTradeBalanceType,
  type TradeBalanceType
} from '@/lib/balance-selection';

/** Resolve the persisted trade balance type from the request cookie. */
export async function getSelectedTradeBalanceType(): Promise<TradeBalanceType> {
  const cookieStore = await cookies();
  return parseTradeBalanceType(
    cookieStore.get(TRADE_BALANCE_COOKIE)?.value
  );
}
