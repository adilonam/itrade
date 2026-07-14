/** Maps `tenantNavItems` titles to `Trade.nav` message keys. */
const TRADE_NAV_TITLE_KEYS = {
  Trade: 'trade',
  Institutional: 'institutional',
  Plans: 'plans',
  Props: 'props',
  Dashboard: 'dashboard',
  Account: 'account',
  Overview: 'overview',
  'Institutional-admin': 'institutionalAdmin',
  Users: 'users',
  Markets: 'markets',
  'Investments-admin': 'investmentsAdmin',
  'KYC Requests': 'kycRequests',
  'Deposit request': 'depositRequest',
  Settings: 'settings',
  'Withdrawals request': 'withdrawals',
  Portfolio: 'portfolio'
} as const;

export type TradeNavMessageKey =
  (typeof TRADE_NAV_TITLE_KEYS)[keyof typeof TRADE_NAV_TITLE_KEYS];

export function tradeNavTitleKey(title: string): TradeNavMessageKey | null {
  return (TRADE_NAV_TITLE_KEYS as Record<string, TradeNavMessageKey>)[title] ?? null;
}
