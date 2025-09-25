import { Icons } from '@/components/icons';

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  isAdmin: boolean;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

// Market Data Types
export interface MarketBase {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface ForexPair extends MarketBase {
  type: 'forex';
  baseCurrency: string;
  quoteCurrency: string;
  bid: number;
  ask: number;
  spread: number;
}

export interface Cryptocurrency extends MarketBase {
  type: 'crypto';
  rank: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  imageUrl: string;
}

export type Market = ForexPair | Cryptocurrency;

export type ViewType = 'cards' | 'list';

// Re-export AlphaVantage types
export * from './alphavantage';

// Re-export FXCM types
export * from './fxcm';
