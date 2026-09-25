/**
 * Seed global markets (200 CFD catalogue instruments across forex, indices,
 * commodities, crypto, US/UK-EU/Asia-Pacific/SA shares, ETFs, and bonds/rates).
 * Validates symbols via Twelve Data, upserts spread on existing markets, creates
 * missing ones. Prints created / updated / not-found summary.
 *
 * ETFs use STOCKS; bonds & rates use INDICES (no dedicated MarketType yet).
 * Run: pnpm db:seed-markets
 */
/* eslint-disable no-console */
import 'dotenv/config';
import type { MarketType } from '@/lib/prisma/generated/client';
import { PrismaClient } from '@/lib/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  requireTwelveDataServerApiKey,
  TWELVE_DATA_SERVER_KEY_ENV
} from '@/lib/twelve-data-config';

const ROOM = 'TRADING' as const;
const TWELVE_DATA_BASE = 'https://api.twelvedata.com';
const API_DELAY_MS = 250;

type MarketSpec = {
  type: MarketType;
  symbol: string;
  twelveDataSymbol: string;
  name: string;
  spread: number;
};

type TwelveDataQuote = {
  name?: string;
  close?: string;
  change?: string;
  code?: number;
  message?: string;
};

const MARKET_SPECS: MarketSpec[] = [
  // ── 1. Forex ──────────────────────────────────────────────────────────────
  {
    type: 'FOREX',
    symbol: 'EURUSD',
    twelveDataSymbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    spread: 0.00012
  },
  {
    type: 'FOREX',
    symbol: 'GBPUSD',
    twelveDataSymbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    spread: 0.00015
  },
  {
    type: 'FOREX',
    symbol: 'USDJPY',
    twelveDataSymbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    spread: 0.02
  },
  {
    type: 'FOREX',
    symbol: 'USDCHF',
    twelveDataSymbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    spread: 0.00012
  },
  {
    type: 'FOREX',
    symbol: 'AUDUSD',
    twelveDataSymbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    spread: 0.00012
  },
  {
    type: 'FOREX',
    symbol: 'USDCAD',
    twelveDataSymbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    spread: 0.00012
  },
  {
    type: 'FOREX',
    symbol: 'NZDUSD',
    twelveDataSymbol: 'NZD/USD',
    name: 'New Zealand Dollar / US Dollar',
    spread: 0.00015
  },
  {
    type: 'FOREX',
    symbol: 'EURGBP',
    twelveDataSymbol: 'EUR/GBP',
    name: 'Euro / British Pound',
    spread: 0.00015
  },
  {
    type: 'FOREX',
    symbol: 'EURJPY',
    twelveDataSymbol: 'EUR/JPY',
    name: 'Euro / Japanese Yen',
    spread: 0.02
  },
  {
    type: 'FOREX',
    symbol: 'GBPJPY',
    twelveDataSymbol: 'GBP/JPY',
    name: 'British Pound / Japanese Yen',
    spread: 0.03
  },
  {
    type: 'FOREX',
    symbol: 'AUDJPY',
    twelveDataSymbol: 'AUD/JPY',
    name: 'Australian Dollar / Japanese Yen',
    spread: 0.03
  },
  {
    type: 'FOREX',
    symbol: 'EURAUD',
    twelveDataSymbol: 'EUR/AUD',
    name: 'Euro / Australian Dollar',
    spread: 0.0002
  },
  {
    type: 'FOREX',
    symbol: 'EURCHF',
    twelveDataSymbol: 'EUR/CHF',
    name: 'Euro / Swiss Franc',
    spread: 0.00015
  },
  {
    type: 'FOREX',
    symbol: 'GBPAUD',
    twelveDataSymbol: 'GBP/AUD',
    name: 'British Pound / Australian Dollar',
    spread: 0.00025
  },
  {
    type: 'FOREX',
    symbol: 'CADJPY',
    twelveDataSymbol: 'CAD/JPY',
    name: 'Canadian Dollar / Japanese Yen',
    spread: 0.03
  },
  {
    type: 'FOREX',
    symbol: 'USDZAR',
    twelveDataSymbol: 'USD/ZAR',
    name: 'US Dollar / South African Rand',
    spread: 0.005
  },
  {
    type: 'FOREX',
    symbol: 'EURZAR',
    twelveDataSymbol: 'EUR/ZAR',
    name: 'Euro / South African Rand',
    spread: 0.008
  },
  {
    type: 'FOREX',
    symbol: 'GBPZAR',
    twelveDataSymbol: 'GBP/ZAR',
    name: 'British Pound / South African Rand',
    spread: 0.01
  },
  {
    type: 'FOREX',
    symbol: 'USDCNH',
    twelveDataSymbol: 'USD/CNH',
    name: 'US Dollar / Chinese Yuan',
    spread: 0.001
  },
  {
    type: 'FOREX',
    symbol: 'USDMXN',
    twelveDataSymbol: 'USD/MXN',
    name: 'US Dollar / Mexican Peso',
    spread: 0.002
  },

  // ── 2. Global stock indices ───────────────────────────────────────────────
  {
    type: 'INDICES',
    symbol: 'US500',
    twelveDataSymbol: 'SPX',
    name: 'US 500',
    spread: 0.8
  },
  {
    type: 'INDICES',
    symbol: 'USTECH100',
    twelveDataSymbol: 'NDX',
    name: 'US Tech 100',
    spread: 1.2
  },
  {
    type: 'INDICES',
    symbol: 'WALLST30',
    twelveDataSymbol: 'DJI',
    name: 'Wall Street 30',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'USSC2000',
    twelveDataSymbol: 'RUT',
    name: 'US Small Cap 2000',
    spread: 1.5
  },
  {
    type: 'INDICES',
    symbol: 'UK100',
    twelveDataSymbol: 'FTSE',
    name: 'UK 100',
    spread: 0.8
  },
  {
    type: 'INDICES',
    symbol: 'GER40',
    twelveDataSymbol: 'DAX',
    name: 'Germany 40',
    spread: 1
  },
  {
    type: 'INDICES',
    symbol: 'FRA40',
    twelveDataSymbol: 'CAC',
    name: 'France 40',
    spread: 1
  },
  {
    type: 'INDICES',
    symbol: 'EU50',
    twelveDataSymbol: 'SX5E',
    name: 'EU Stocks 50',
    spread: 1.2
  },
  {
    type: 'INDICES',
    symbol: 'SPA35',
    twelveDataSymbol: 'IBEX',
    name: 'Spain 35',
    spread: 1.5
  },
  {
    type: 'INDICES',
    symbol: 'ITA40',
    twelveDataSymbol: 'FTSEMIB',
    name: 'Italy 40',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'NED25',
    twelveDataSymbol: 'AEX',
    name: 'Netherlands 25',
    spread: 0.5
  },
  {
    type: 'INDICES',
    symbol: 'SWI20',
    twelveDataSymbol: 'SMI',
    name: 'Switzerland 20',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'JPN225',
    twelveDataSymbol: 'N225',
    name: 'Japan 225',
    spread: 15
  },
  {
    type: 'INDICES',
    symbol: 'HK50',
    twelveDataSymbol: 'HSI',
    name: 'Hong Kong 50',
    spread: 8
  },
  {
    type: 'INDICES',
    symbol: 'CHINA50',
    twelveDataSymbol: 'XIN9',
    name: 'China A50',
    spread: 8
  },
  {
    type: 'INDICES',
    symbol: 'AUS200',
    twelveDataSymbol: 'ASX',
    name: 'Australia 200',
    spread: 1.5
  },
  {
    type: 'INDICES',
    symbol: 'SG30',
    twelveDataSymbol: 'STI',
    name: 'Singapore 30',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'IND50',
    twelveDataSymbol: 'NIFTY',
    name: 'India 50',
    spread: 3
  },
  {
    type: 'INDICES',
    symbol: 'SA40',
    twelveDataSymbol: 'JTOPI',
    name: 'South Africa 40',
    spread: 8
  },
  {
    type: 'INDICES',
    symbol: 'VIX',
    twelveDataSymbol: 'VIX',
    name: 'US Volatility/VIX',
    spread: 0.05
  },

  // ── 3. Commodities ────────────────────────────────────────────────────────
  {
    type: 'COMMODITIES',
    symbol: 'XAUUSD',
    twelveDataSymbol: 'XAU/USD',
    name: 'Gold',
    spread: 0.45
  },
  {
    type: 'COMMODITIES',
    symbol: 'XAGUSD',
    twelveDataSymbol: 'XAG/USD',
    name: 'Silver',
    spread: 0.02
  },
  {
    type: 'COMMODITIES',
    symbol: 'UKOIL',
    twelveDataSymbol: 'BRENT/USD',
    name: 'Brent crude oil',
    spread: 0.03
  },
  {
    type: 'COMMODITIES',
    symbol: 'USOIL',
    twelveDataSymbol: 'WTI/USD',
    name: 'West Texas Intermediate oil',
    spread: 0.03
  },
  {
    type: 'COMMODITIES',
    symbol: 'NATGAS',
    twelveDataSymbol: 'NG/USD',
    name: 'Natural gas',
    spread: 0.01
  },
  {
    type: 'COMMODITIES',
    symbol: 'COPPER',
    twelveDataSymbol: 'HG',
    name: 'Copper',
    spread: 0.005
  },
  {
    type: 'COMMODITIES',
    symbol: 'XPTUSD',
    twelveDataSymbol: 'XPT/USD',
    name: 'Platinum',
    spread: 1.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'XPDUSD',
    twelveDataSymbol: 'XPD/USD',
    name: 'Palladium',
    spread: 2
  },
  {
    type: 'COMMODITIES',
    symbol: 'ALUMINIUM',
    twelveDataSymbol: 'ALI',
    name: 'Aluminium',
    spread: 5
  },
  {
    type: 'COMMODITIES',
    symbol: 'NICKEL',
    twelveDataSymbol: 'NICKEL',
    name: 'Nickel',
    spread: 20
  },
  {
    type: 'COMMODITIES',
    symbol: 'ZINC',
    twelveDataSymbol: 'ZINC',
    name: 'Zinc',
    spread: 5
  },
  {
    type: 'COMMODITIES',
    symbol: 'IRONORE',
    twelveDataSymbol: 'IRON',
    name: 'Iron ore',
    spread: 0.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'COCOA',
    twelveDataSymbol: 'CC',
    name: 'Cocoa',
    spread: 5
  },
  {
    type: 'COMMODITIES',
    symbol: 'COFFEE',
    twelveDataSymbol: 'KC',
    name: 'Arabica coffee',
    spread: 0.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'SUGAR',
    twelveDataSymbol: 'SB',
    name: 'Sugar No. 11',
    spread: 0.02
  },
  {
    type: 'COMMODITIES',
    symbol: 'CORN',
    twelveDataSymbol: 'ZC',
    name: 'Corn',
    spread: 0.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'WHEAT',
    twelveDataSymbol: 'ZW',
    name: 'Wheat',
    spread: 0.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'SOYBEAN',
    twelveDataSymbol: 'ZS',
    name: 'Soybeans',
    spread: 0.5
  },
  {
    type: 'COMMODITIES',
    symbol: 'COTTON',
    twelveDataSymbol: 'CT',
    name: 'Cotton No. 2',
    spread: 0.2
  },
  {
    type: 'COMMODITIES',
    symbol: 'CATTLE',
    twelveDataSymbol: 'LE',
    name: 'Live cattle',
    spread: 0.1
  },

  // ── 4. Cryptocurrencies ───────────────────────────────────────────────────
  {
    type: 'CRYPTO',
    symbol: 'BTCUSD',
    twelveDataSymbol: 'BTC/USD',
    name: 'Bitcoin',
    spread: 12
  },
  {
    type: 'CRYPTO',
    symbol: 'ETHUSD',
    twelveDataSymbol: 'ETH/USD',
    name: 'Ethereum',
    spread: 2.5
  },
  {
    type: 'CRYPTO',
    symbol: 'BNBUSD',
    twelveDataSymbol: 'BNB/USD',
    name: 'BNB',
    spread: 0.3
  },
  {
    type: 'CRYPTO',
    symbol: 'XRPUSD',
    twelveDataSymbol: 'XRP/USD',
    name: 'XRP',
    spread: 0.001
  },
  {
    type: 'CRYPTO',
    symbol: 'SOLUSD',
    twelveDataSymbol: 'SOL/USD',
    name: 'Solana',
    spread: 0.15
  },
  {
    type: 'CRYPTO',
    symbol: 'TRXUSD',
    twelveDataSymbol: 'TRX/USD',
    name: 'TRON',
    spread: 0.0002
  },
  {
    type: 'CRYPTO',
    symbol: 'HYPEUSD',
    twelveDataSymbol: 'HYPE/USD',
    name: 'Hyperliquid',
    spread: 0.05
  },
  {
    type: 'CRYPTO',
    symbol: 'DOGEUSD',
    twelveDataSymbol: 'DOGE/USD',
    name: 'Dogecoin',
    spread: 0.0002
  },
  {
    type: 'CRYPTO',
    symbol: 'ADAUSD',
    twelveDataSymbol: 'ADA/USD',
    name: 'Cardano',
    spread: 0.0005
  },
  {
    type: 'CRYPTO',
    symbol: 'LINKUSD',
    twelveDataSymbol: 'LINK/USD',
    name: 'Chainlink',
    spread: 0.02
  },
  {
    type: 'CRYPTO',
    symbol: 'XLMUSD',
    twelveDataSymbol: 'XLM/USD',
    name: 'Stellar',
    spread: 0.0002
  },
  {
    type: 'CRYPTO',
    symbol: 'BCHUSD',
    twelveDataSymbol: 'BCH/USD',
    name: 'Bitcoin Cash',
    spread: 0.3
  },
  {
    type: 'CRYPTO',
    symbol: 'LTCUSD',
    twelveDataSymbol: 'LTC/USD',
    name: 'Litecoin',
    spread: 0.1
  },
  {
    type: 'CRYPTO',
    symbol: 'HBARUSD',
    twelveDataSymbol: 'HBAR/USD',
    name: 'Hedera',
    spread: 0.0002
  },
  {
    type: 'CRYPTO',
    symbol: 'SHIBUSD',
    twelveDataSymbol: 'SHIB/USD',
    name: 'Shiba Inu',
    spread: 0.0000001
  },
  {
    type: 'CRYPTO',
    symbol: 'AVAXUSD',
    twelveDataSymbol: 'AVAX/USD',
    name: 'Avalanche',
    spread: 0.05
  },
  {
    type: 'CRYPTO',
    symbol: 'SUIUSD',
    twelveDataSymbol: 'SUI/USD',
    name: 'Sui',
    spread: 0.01
  },
  {
    type: 'CRYPTO',
    symbol: 'UNIUSD',
    twelveDataSymbol: 'UNI/USD',
    name: 'Uniswap',
    spread: 0.02
  },
  {
    type: 'CRYPTO',
    symbol: 'NEARUSD',
    twelveDataSymbol: 'NEAR/USD',
    name: 'NEAR Protocol',
    spread: 0.02
  },
  {
    type: 'CRYPTO',
    symbol: 'AAVEUSD',
    twelveDataSymbol: 'AAVE/USD',
    name: 'Aave',
    spread: 0.3
  },

  // ── 5. US shares ──────────────────────────────────────────────────────────
  {
    type: 'STOCKS',
    symbol: 'NVDA',
    twelveDataSymbol: 'NVDA',
    name: 'NVIDIA',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'AAPL',
    twelveDataSymbol: 'AAPL',
    name: 'Apple',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'MSFT',
    twelveDataSymbol: 'MSFT',
    name: 'Microsoft',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'AMZN',
    twelveDataSymbol: 'AMZN',
    name: 'Amazon',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'META',
    twelveDataSymbol: 'META',
    name: 'Meta Platforms',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'GOOGL',
    twelveDataSymbol: 'GOOGL',
    name: 'Alphabet Class A',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'TSLA',
    twelveDataSymbol: 'TSLA',
    name: 'Tesla',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'AVGO',
    twelveDataSymbol: 'AVGO',
    name: 'Broadcom',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'AMD',
    twelveDataSymbol: 'AMD',
    name: 'Advanced Micro Devices',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'NFLX',
    twelveDataSymbol: 'NFLX',
    name: 'Netflix',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'COIN',
    twelveDataSymbol: 'COIN',
    name: 'Coinbase',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'PLTR',
    twelveDataSymbol: 'PLTR',
    name: 'Palantir Technologies',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'JPM',
    twelveDataSymbol: 'JPM',
    name: 'JPMorgan Chase',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BAC',
    twelveDataSymbol: 'BAC',
    name: 'Bank of America',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'XOM',
    twelveDataSymbol: 'XOM',
    name: 'Exxon Mobil',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'WMT',
    twelveDataSymbol: 'WMT',
    name: 'Walmart',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'LLY',
    twelveDataSymbol: 'LLY',
    name: 'Eli Lilly',
    spread: 0.15
  },
  {
    type: 'STOCKS',
    symbol: 'V',
    twelveDataSymbol: 'V',
    name: 'Visa',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'MA',
    twelveDataSymbol: 'MA',
    name: 'Mastercard',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'COST',
    twelveDataSymbol: 'COST',
    name: 'Costco Wholesale',
    spread: 0.1
  },

  // ── 6. UK and European shares ─────────────────────────────────────────────
  {
    type: 'STOCKS',
    symbol: 'ASML',
    twelveDataSymbol: 'ASML',
    name: 'ASML Holding',
    spread: 0.5
  },
  {
    type: 'STOCKS',
    symbol: 'SAP',
    twelveDataSymbol: 'SAP',
    name: 'SAP',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'NVO',
    twelveDataSymbol: 'NVO',
    name: 'Novo Nordisk',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'LVMUY',
    twelveDataSymbol: 'LVMUY',
    name: 'LVMH',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'SIEGY',
    twelveDataSymbol: 'SIEGY',
    name: 'Siemens',
    spread: 0.15
  },
  {
    type: 'STOCKS',
    symbol: 'ALIZY',
    twelveDataSymbol: 'ALIZY',
    name: 'Allianz',
    spread: 0.15
  },
  {
    type: 'STOCKS',
    symbol: 'EADSY',
    twelveDataSymbol: 'EADSY',
    name: 'Airbus',
    spread: 0.15
  },
  {
    type: 'STOCKS',
    symbol: 'TTE',
    twelveDataSymbol: 'TTE',
    name: 'TotalEnergies',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'RACE',
    twelveDataSymbol: 'RACE',
    name: 'Ferrari',
    spread: 0.3
  },
  {
    type: 'STOCKS',
    symbol: 'DB',
    twelveDataSymbol: 'DB',
    name: 'Deutsche Bank',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'UBS',
    twelveDataSymbol: 'UBS',
    name: 'UBS Group',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'SHEL',
    twelveDataSymbol: 'SHEL',
    name: 'Shell',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'HSBC',
    twelveDataSymbol: 'HSBC',
    name: 'HSBC Holdings',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'AZN',
    twelveDataSymbol: 'AZN',
    name: 'AstraZeneca',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'UL',
    twelveDataSymbol: 'UL',
    name: 'Unilever',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BP',
    twelveDataSymbol: 'BP',
    name: 'BP',
    spread: 0.03
  },
  {
    type: 'STOCKS',
    symbol: 'RYCEY',
    twelveDataSymbol: 'RYCEY',
    name: 'Rolls-Royce Holdings',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'RIO',
    twelveDataSymbol: 'RIO',
    name: 'Rio Tinto',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'GLNCY',
    twelveDataSymbol: 'GLNCY',
    name: 'Glencore',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'BCS',
    twelveDataSymbol: 'BCS',
    name: 'Barclays',
    spread: 0.02
  },

  // ── 7. Asia-Pacific shares ────────────────────────────────────────────────
  {
    type: 'STOCKS',
    symbol: 'TSM',
    twelveDataSymbol: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'SSNLF',
    twelveDataSymbol: 'SSNLF',
    name: 'Samsung Electronics',
    spread: 0.5
  },
  {
    type: 'STOCKS',
    symbol: 'TCEHY',
    twelveDataSymbol: 'TCEHY',
    name: 'Tencent Holdings',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BABA',
    twelveDataSymbol: 'BABA',
    name: 'Alibaba Group',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'TM',
    twelveDataSymbol: 'TM',
    name: 'Toyota Motor',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'SONY',
    twelveDataSymbol: 'SONY',
    name: 'Sony Group',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'SFTBY',
    twelveDataSymbol: 'SFTBY',
    name: 'SoftBank Group',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'NTDOY',
    twelveDataSymbol: 'NTDOY',
    name: 'Nintendo',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BYDDY',
    twelveDataSymbol: 'BYDDY',
    name: 'BYD',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'XIACY',
    twelveDataSymbol: 'XIACY',
    name: 'Xiaomi',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'JD',
    twelveDataSymbol: 'JD',
    name: 'JD.com',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'MPNGY',
    twelveDataSymbol: 'MPNGY',
    name: 'Meituan',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'PDD',
    twelveDataSymbol: 'PDD',
    name: 'PDD Holdings',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'RELIANCE',
    twelveDataSymbol: 'RELIANCE:NSE',
    name: 'Reliance Industries',
    spread: 5
  },
  {
    type: 'STOCKS',
    symbol: 'INFY',
    twelveDataSymbol: 'INFY',
    name: 'Infosys',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'IBN',
    twelveDataSymbol: 'IBN',
    name: 'ICICI Bank',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'HDB',
    twelveDataSymbol: 'HDB',
    name: 'HDFC Bank',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BHP',
    twelveDataSymbol: 'BHP',
    name: 'BHP Group',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'CMWAY',
    twelveDataSymbol: 'CMWAY',
    name: 'Commonwealth Bank',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'CSLLY',
    twelveDataSymbol: 'CSLLY',
    name: 'CSL',
    spread: 0.15
  },

  // ── 8. South African shares (JSE) ─────────────────────────────────────────
  {
    type: 'STOCKS',
    symbol: 'NPN',
    twelveDataSymbol: 'NPN:JSE',
    name: 'Naspers N',
    spread: 5
  },
  {
    type: 'STOCKS',
    symbol: 'GFI',
    twelveDataSymbol: 'GFI',
    name: 'Gold Fields',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'FSR',
    twelveDataSymbol: 'FSR:JSE',
    name: 'FirstRand',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'ANG',
    twelveDataSymbol: 'ANG:JSE',
    name: 'AngloGold Ashanti',
    spread: 0.5
  },
  {
    type: 'STOCKS',
    symbol: 'SBK',
    twelveDataSymbol: 'SBK:JSE',
    name: 'Standard Bank Group',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'CPI',
    twelveDataSymbol: 'CPI:JSE',
    name: 'Capitec Bank Holdings',
    spread: 2
  },
  {
    type: 'STOCKS',
    symbol: 'MTN',
    twelveDataSymbol: 'MTN:JSE',
    name: 'MTN Group',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'VAL',
    twelveDataSymbol: 'VAL:JSE',
    name: 'Valterra Platinum',
    spread: 1
  },
  {
    type: 'STOCKS',
    symbol: 'SHP',
    twelveDataSymbol: 'SHP:JSE',
    name: 'Shoprite Holdings',
    spread: 0.3
  },
  {
    type: 'STOCKS',
    symbol: 'PRX',
    twelveDataSymbol: 'PRX:JSE',
    name: 'Prosus',
    spread: 1
  },
  {
    type: 'STOCKS',
    symbol: 'CFR',
    twelveDataSymbol: 'CFR:JSE',
    name: 'Richemont',
    spread: 2
  },
  {
    type: 'STOCKS',
    symbol: 'ABG',
    twelveDataSymbol: 'ABG:JSE',
    name: 'Absa Group',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'SLM',
    twelveDataSymbol: 'SLM:JSE',
    name: 'Sanlam',
    spread: 0.1
  },
  {
    type: 'STOCKS',
    symbol: 'DSY',
    twelveDataSymbol: 'DSY:JSE',
    name: 'Discovery',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'SOL',
    twelveDataSymbol: 'SOL:JSE',
    name: 'Sasol',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'BID',
    twelveDataSymbol: 'BID:JSE',
    name: 'Bidcorp',
    spread: 0.5
  },
  {
    type: 'STOCKS',
    symbol: 'BVT',
    twelveDataSymbol: 'BVT:JSE',
    name: 'Bidvest Group',
    spread: 0.3
  },
  {
    type: 'STOCKS',
    symbol: 'NED',
    twelveDataSymbol: 'NED:JSE',
    name: 'Nedbank Group',
    spread: 0.3
  },
  {
    type: 'STOCKS',
    symbol: 'IMP',
    twelveDataSymbol: 'IMP:JSE',
    name: 'Impala Platinum Holdings',
    spread: 0.2
  },
  {
    type: 'STOCKS',
    symbol: 'NPH',
    twelveDataSymbol: 'NPH:JSE',
    name: 'Northam Platinum Holdings',
    spread: 0.2
  },

  // ── 9. Exchange-traded funds ──────────────────────────────────────────────
  {
    type: 'STOCKS',
    symbol: 'SPY',
    twelveDataSymbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'QQQ',
    twelveDataSymbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'IWM',
    twelveDataSymbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'DIA',
    twelveDataSymbol: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'VTI',
    twelveDataSymbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'EEM',
    twelveDataSymbol: 'EEM',
    name: 'iShares MSCI Emerging Markets ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'EFA',
    twelveDataSymbol: 'EFA',
    name: 'iShares MSCI EAFE ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'GLD',
    twelveDataSymbol: 'GLD',
    name: 'SPDR Gold Shares',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'SLV',
    twelveDataSymbol: 'SLV',
    name: 'iShares Silver Trust',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'USO',
    twelveDataSymbol: 'USO',
    name: 'United States Oil Fund',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'TLT',
    twelveDataSymbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'HYG',
    twelveDataSymbol: 'HYG',
    name: 'iShares iBoxx High Yield Corporate Bond ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'LQD',
    twelveDataSymbol: 'LQD',
    name: 'iShares Investment Grade Corporate Bond ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'XLF',
    twelveDataSymbol: 'XLF',
    name: 'Financial Select Sector SPDR Fund',
    spread: 0.01
  },
  {
    type: 'STOCKS',
    symbol: 'XLK',
    twelveDataSymbol: 'XLK',
    name: 'Technology Select Sector SPDR Fund',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'XLE',
    twelveDataSymbol: 'XLE',
    name: 'Energy Select Sector SPDR Fund',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'XLV',
    twelveDataSymbol: 'XLV',
    name: 'Health Care Select Sector SPDR Fund',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'ARKK',
    twelveDataSymbol: 'ARKK',
    name: 'ARK Innovation ETF',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'IBIT',
    twelveDataSymbol: 'IBIT',
    name: 'iShares Bitcoin Trust ETF',
    spread: 0.02
  },
  {
    type: 'STOCKS',
    symbol: 'ETHA',
    twelveDataSymbol: 'ETHA',
    name: 'iShares Ethereum Trust ETF',
    spread: 0.02
  },

  // ── 10. Government bonds and interest rates ───────────────────────────────
  {
    type: 'INDICES',
    symbol: 'US2Y',
    twelveDataSymbol: 'ZT',
    name: 'US 2Y Note',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'US5Y',
    twelveDataSymbol: 'ZF',
    name: 'US 5Y Note',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'US10Y',
    twelveDataSymbol: 'ZN',
    name: 'US 10Y Note',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'USU10Y',
    twelveDataSymbol: 'TN',
    name: 'US Ultra 10Y',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'US30Y',
    twelveDataSymbol: 'ZB',
    name: 'US 30Y Bond',
    spread: 0.02
  },
  {
    type: 'INDICES',
    symbol: 'USUBOND',
    twelveDataSymbol: 'UB',
    name: 'US Ultra Bond',
    spread: 0.02
  },
  {
    type: 'INDICES',
    symbol: 'SCHATZ',
    twelveDataSymbol: 'FGBS',
    name: 'Euro Schatz',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'BOBL',
    twelveDataSymbol: 'FGBM',
    name: 'Euro Bobl',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'BUND',
    twelveDataSymbol: 'FGBL',
    name: 'Euro Bund',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'BUXL',
    twelveDataSymbol: 'FGBX',
    name: 'Euro Buxl',
    spread: 0.02
  },
  {
    type: 'INDICES',
    symbol: 'GILT',
    twelveDataSymbol: 'G',
    name: 'UK Gilt',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'OAT',
    twelveDataSymbol: 'FOAT',
    name: 'France OAT',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'BTP',
    twelveDataSymbol: 'FBTP',
    name: 'Italy BTP',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'JGB',
    twelveDataSymbol: 'JGB',
    name: 'Japan JGB',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'AUS3Y',
    twelveDataSymbol: 'YT',
    name: 'Australia 3Y',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'AUS10Y',
    twelveDataSymbol: 'XT',
    name: 'Australia 10Y',
    spread: 0.01
  },
  {
    type: 'INDICES',
    symbol: 'SOFR3M',
    twelveDataSymbol: 'SR3',
    name: 'SOFR 3M',
    spread: 0.005
  },
  {
    type: 'INDICES',
    symbol: 'EURIBOR3M',
    twelveDataSymbol: 'FEI',
    name: 'EURIBOR 3M',
    spread: 0.005
  },
  {
    type: 'INDICES',
    symbol: 'SONIA3M',
    twelveDataSymbol: 'SON3',
    name: 'SONIA 3M',
    spread: 0.005
  },
  {
    type: 'INDICES',
    symbol: 'FEDFUNDS',
    twelveDataSymbol: 'ZQ',
    name: 'Fed Funds',
    spread: 0.005
  }
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function validateWithTwelveData(twelveDataSymbol: string): Promise<
  | { ok: true; name: string; lastPrice: number; lastChange: number }
  | { ok: false; message: string }
> {
  const url = new URL(`${TWELVE_DATA_BASE}/quote`);
  url.searchParams.set('symbol', twelveDataSymbol);
  url.searchParams.set('apikey', requireTwelveDataServerApiKey());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    return {
      ok: false,
      message: `HTTP ${response.status}: ${response.statusText}`
    };
  }

  const data = (await response.json()) as TwelveDataQuote;

  if (data.code && data.message) {
    return { ok: false, message: data.message };
  }

  const lastPrice = parseFloat(data.close ?? '');
  if (!Number.isFinite(lastPrice)) {
    return { ok: false, message: 'No valid price in Twelve Data response' };
  }

  const lastChange = parseFloat(data.change ?? '0');

  return {
    ok: true,
    name: data.name?.trim() || twelveDataSymbol,
    lastPrice,
    lastChange: Number.isFinite(lastChange) ? lastChange : 0
  };
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    requireTwelveDataServerApiKey();
  } catch {
    console.error(
      `Error: ${TWELVE_DATA_SERVER_KEY_ENV} is required. Set it in your .env file.`
    );
    process.exit(1);
  }

  console.log(`Seeding ${MARKET_SPECS.length} markets (room: ${ROOM})...\n`);

  let createdCount = 0;
  let updatedCount = 0;
  const notFound: { symbol: string; twelveDataSymbol: string; message: string }[] =
    [];

  for (const spec of MARKET_SPECS) {
    process.stdout.write(`Checking ${spec.symbol} (${spec.twelveDataSymbol})... `);

    const validation = await validateWithTwelveData(spec.twelveDataSymbol);

    if (!validation.ok) {
      console.log('NOT FOUND');
      notFound.push({
        symbol: spec.symbol,
        twelveDataSymbol: spec.twelveDataSymbol,
        message: validation.message
      });
      await sleep(API_DELAY_MS);
      continue;
    }

    const existing = await prisma.market.findFirst({
      where: {
        symbol: spec.symbol,
        type: spec.type,
        room: ROOM
      }
    });

    if (existing) {
      await prisma.market.update({
        where: { id: existing.id },
        data: { spread: spec.spread }
      });
      console.log(`updated spread → ${spec.spread}`);
      updatedCount++;
    } else {
      await prisma.market.create({
        data: {
          symbol: spec.symbol,
          name: validation.name || spec.name,
          type: spec.type,
          room: ROOM,
          spread: spec.spread,
          lastPrice: validation.lastPrice,
          lastChange: validation.lastChange,
          visible: true
        }
      });
      console.log('created');
      createdCount++;
    }

    await sleep(API_DELAY_MS);
  }

  console.log('\n--- Summary ---');
  console.log(`Created:    ${createdCount}`);
  console.log(`Updated:    ${updatedCount}`);
  console.log(`Not found:  ${notFound.length}`);

  if (notFound.length > 0) {
    console.log('\nSymbols not found on Twelve Data:');
    for (const row of notFound) {
      console.log(
        `  - ${row.symbol} (API: ${row.twelveDataSymbol}) — ${row.message}`
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
