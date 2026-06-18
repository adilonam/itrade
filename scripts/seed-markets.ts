/**
 * Seed global markets: validate symbols via Twelve Data, upsert spread on existing
 * markets, create missing ones. Prints created / updated / not-found summary.
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
  // Forex
  {
    type: 'FOREX',
    symbol: 'EURUSD',
    twelveDataSymbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    spread: 0.00012
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
    symbol: 'GBPUSD',
    twelveDataSymbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    spread: 0.00015
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
    spread: 0.00012
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

  // Stocks
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
    symbol: 'NVDA',
    twelveDataSymbol: 'NVDA',
    name: 'NVIDIA',
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
    symbol: 'GOOGL',
    twelveDataSymbol: 'GOOGL',
    name: 'Alphabet',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'META',
    twelveDataSymbol: 'META',
    name: 'Meta',
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
    symbol: '2222.SR',
    twelveDataSymbol: '2222.SR',
    name: 'Saudi Aramco',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'TSM',
    twelveDataSymbol: 'TSM',
    name: 'TSMC',
    spread: 0.05
  },
  {
    type: 'STOCKS',
    symbol: 'BRK.B',
    twelveDataSymbol: 'BRK.B',
    name: 'Berkshire Hathaway',
    spread: 0.05
  },

  // Commodities
  {
    type: 'COMMODITIES',
    symbol: 'XAUUSD',
    twelveDataSymbol: 'XAU/USD',
    name: 'Gold / US Dollar',
    spread: 0.45
  },
  {
    type: 'COMMODITIES',
    symbol: 'XAGUSD',
    twelveDataSymbol: 'XAG/USD',
    name: 'Silver / US Dollar',
    spread: 0.02
  },
  {
    type: 'COMMODITIES',
    symbol: 'WTI',
    twelveDataSymbol: 'WTI/USD',
    name: 'Crude Oil (WTI)',
    spread: 0.03
  },
  {
    type: 'COMMODITIES',
    symbol: 'BRENT',
    twelveDataSymbol: 'BRENT/USD',
    name: 'Brent Crude',
    spread: 0.03
  },
  {
    type: 'COMMODITIES',
    symbol: 'NATGAS',
    twelveDataSymbol: 'NG/USD',
    name: 'Natural Gas',
    spread: 0.005
  },
  {
    type: 'COMMODITIES',
    symbol: 'COPPER',
    twelveDataSymbol: 'COPPER',
    name: 'Copper',
    spread: 0.002
  },
  {
    type: 'COMMODITIES',
    symbol: 'WHEAT',
    twelveDataSymbol: 'ZW/USD',
    name: 'Wheat',
    spread: 0.01
  },
  {
    type: 'COMMODITIES',
    symbol: 'COFFEE',
    twelveDataSymbol: 'KC/USD',
    name: 'Coffee',
    spread: 0.01
  },
  {
    type: 'COMMODITIES',
    symbol: 'SUGAR',
    twelveDataSymbol: 'SB/USD',
    name: 'Sugar',
    spread: 0.001
  },
  {
    type: 'COMMODITIES',
    symbol: 'COTTON',
    twelveDataSymbol: 'CT/USD',
    name: 'Cotton',
    spread: 0.001
  },

  // Indices
  {
    type: 'INDICES',
    symbol: 'US500',
    twelveDataSymbol: 'SPX',
    name: 'S&P 500',
    spread: 0.8
  },
  {
    type: 'INDICES',
    symbol: 'NDX',
    twelveDataSymbol: 'NDX',
    name: 'NASDAQ Composite',
    spread: 1.2
  },
  {
    type: 'INDICES',
    symbol: 'DJI',
    twelveDataSymbol: 'DJI',
    name: 'Dow Jones Industrial Average',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'DAX',
    twelveDataSymbol: 'DAX',
    name: 'DAX',
    spread: 1
  },
  {
    type: 'INDICES',
    symbol: 'FTSE',
    twelveDataSymbol: 'FTSE',
    name: 'FTSE 100',
    spread: 0.8
  },
  {
    type: 'INDICES',
    symbol: 'N225',
    twelveDataSymbol: 'N225',
    name: 'Nikkei 225',
    spread: 15
  },
  {
    type: 'INDICES',
    symbol: 'HSI',
    twelveDataSymbol: 'HSI',
    name: 'Hang Seng Index',
    spread: 5
  },
  {
    type: 'INDICES',
    symbol: 'SSEC',
    twelveDataSymbol: 'SSEC',
    name: 'Shanghai Composite',
    spread: 2
  },
  {
    type: 'INDICES',
    symbol: 'CAC40',
    twelveDataSymbol: 'CAC40',
    name: 'CAC 40',
    spread: 0.8
  },
  {
    type: 'INDICES',
    symbol: 'TASI',
    twelveDataSymbol: 'TASI',
    name: 'Tadawul All Share Index',
    spread: 5
  },

  // Crypto
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
    name: 'Binance Coin',
    spread: 0.5
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
    symbol: 'XRPUSD',
    twelveDataSymbol: 'XRP/USD',
    name: 'XRP',
    spread: 0.001
  },
  {
    type: 'CRYPTO',
    symbol: 'ADAUSD',
    twelveDataSymbol: 'ADA/USD',
    name: 'Cardano',
    spread: 0.001
  },
  {
    type: 'CRYPTO',
    symbol: 'DOGEUSD',
    twelveDataSymbol: 'DOGE/USD',
    name: 'Dogecoin',
    spread: 0.0001
  },
  {
    type: 'CRYPTO',
    symbol: 'AVAXUSD',
    twelveDataSymbol: 'AVAX/USD',
    name: 'Avalanche',
    spread: 0.02
  },
  {
    type: 'CRYPTO',
    symbol: 'DOTUSD',
    twelveDataSymbol: 'DOT/USD',
    name: 'Polkadot',
    spread: 0.01
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
    symbol: 'TONUSD',
    twelveDataSymbol: 'TON/USD',
    name: 'Toncoin',
    spread: 0.005
  },
  {
    type: 'CRYPTO',
    symbol: 'TRXUSD',
    twelveDataSymbol: 'TRX/USD',
    name: 'TRON',
    spread: 0.0001
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
    symbol: 'SHIBUSD',
    twelveDataSymbol: 'SHIB/USD',
    name: 'Shiba Inu',
    spread: 0.00000001
  },
  {
    type: 'CRYPTO',
    symbol: 'PEPEUSD',
    twelveDataSymbol: 'PEPE/USD',
    name: 'Pepe',
    spread: 0.00000001
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
