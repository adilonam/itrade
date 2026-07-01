export type PricePredictionTimeSlot = {
  id: string;
  label: string;
  endsAt: number;
  isActive: boolean;
};

export type PricePredictionChartPoint = {
  time: string;
  price: number;
};

export type OrderBookLevel = {
  price: number;
  size: number;
  total: number;
};

export type PricePredictionMarket = {
  slug: string;
  symbol: string;
  name: string;
  title: string;
  iconColor: string;
  currentPrice: number;
  priceToBeat: number;
  upPrice: number;
  downPrice: number;
  upPercent: number;
  volume: string;
  isLive: boolean;
  chartData: PricePredictionChartPoint[];
  orderBook: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
  rules: string[];
};

const FIVE_MIN_MS = 5 * 60 * 1000;

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function roundToFiveMinuteSlot(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  rounded.setMinutes(Math.floor(minutes / 5) * 5);
  return rounded;
}

export function generateTimeSlots(now = Date.now()): PricePredictionTimeSlot[] {
  const currentSlotStart = roundToFiveMinuteSlot(new Date(now));
  const slots: PricePredictionTimeSlot[] = [];

  for (let offset = -2; offset <= 2; offset++) {
    const slotStart = new Date(currentSlotStart.getTime() + offset * FIVE_MIN_MS);
    const slotEnd = new Date(slotStart.getTime() + FIVE_MIN_MS);
    slots.push({
      id: slotStart.toISOString(),
      label: formatTimeLabel(slotStart),
      endsAt: slotEnd.getTime(),
      isActive: offset === 0
    });
  }

  return slots;
}

function generateChartData(
  basePrice: number,
  points = 30
): PricePredictionChartPoint[] {
  const data: PricePredictionChartPoint[] = [];
  const now = Date.now();
  let price = basePrice;

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 60_000);
    const variation = (Math.random() - 0.5) * basePrice * 0.002;
    price = Math.round((price + variation) * 100) / 100;
    data.push({
      time: timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      price
    });
  }

  return data;
}

function generateOrderBook(midPrice: number): {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
} {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < 6; i++) {
    const bidSize = Math.round((Math.random() * 2.5 + 0.1) * 100) / 100;
    const askSize = Math.round((Math.random() * 2.5 + 0.1) * 100) / 100;
    bidTotal += bidSize;
    askTotal += askSize;
    bids.push({
      price: Math.round((midPrice - 0.03 - i * 0.02) * 100) / 100,
      size: bidSize,
      total: Math.round(bidTotal * 100) / 100
    });
    asks.push({
      price: Math.round((midPrice + 0.03 + i * 0.02) * 100) / 100,
      size: askSize,
      total: Math.round(askTotal * 100) / 100
    });
  }

  return { bids, asks };
}

const BASE_MARKETS: Omit<
  PricePredictionMarket,
  'chartData' | 'orderBook'
>[] = [
  {
    slug: 'btc-up-down-5m',
    symbol: 'BTC',
    name: 'Bitcoin',
    title: 'BTC Up or Down 5m',
    iconColor: '#f7931a',
    currentPrice: 97234.5,
    priceToBeat: 97180.0,
    upPrice: 0.94,
    downPrice: 0.07,
    upPercent: 94,
    volume: '$1.2M',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the BTC price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the BTC price at the end of the 5-minute window is lower than the price at the start.',
      'Resolution source is the aggregated spot price feed displayed on this page.',
      'If the market cannot be resolved within 24 hours, it will resolve to the last traded outcome.'
    ]
  },
  {
    slug: 'eth-up-down-5m',
    symbol: 'ETH',
    name: 'Ethereum',
    title: 'ETH Up or Down 5m',
    iconColor: '#627eea',
    currentPrice: 3456.78,
    priceToBeat: 3450.0,
    upPrice: 0.88,
    downPrice: 0.13,
    upPercent: 88,
    volume: '$842K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the ETH price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the ETH price at the end of the 5-minute window is lower than the price at the start.',
      'Resolution source is the aggregated spot price feed displayed on this page.'
    ]
  },
  {
    slug: 'sol-up-down-5m',
    symbol: 'SOL',
    name: 'Solana',
    title: 'SOL Up or Down 5m',
    iconColor: '#9945ff',
    currentPrice: 178.42,
    priceToBeat: 178.0,
    upPrice: 0.72,
    downPrice: 0.29,
    upPercent: 72,
    volume: '$523K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the SOL price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the SOL price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'xrp-up-down-5m',
    symbol: 'XRP',
    name: 'XRP',
    title: 'XRP Up or Down 5m',
    iconColor: '#23292f',
    currentPrice: 2.34,
    priceToBeat: 2.33,
    upPrice: 0.61,
    downPrice: 0.4,
    upPercent: 61,
    volume: '$312K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the XRP price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the XRP price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'doge-up-down-5m',
    symbol: 'DOGE',
    name: 'Dogecoin',
    title: 'DOGE Up or Down 5m',
    iconColor: '#c2a633',
    currentPrice: 0.182,
    priceToBeat: 0.181,
    upPrice: 0.55,
    downPrice: 0.46,
    upPercent: 55,
    volume: '$198K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the DOGE price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the DOGE price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'bnb-up-down-5m',
    symbol: 'BNB',
    name: 'BNB',
    title: 'BNB Up or Down 5m',
    iconColor: '#f3ba2f',
    currentPrice: 612.45,
    priceToBeat: 611.0,
    upPrice: 0.79,
    downPrice: 0.22,
    upPercent: 79,
    volume: '$267K',
    isLive: false,
    rules: [
      'Market resolves to "Up" if the BNB price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the BNB price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'ada-up-down-5m',
    symbol: 'ADA',
    name: 'Cardano',
    title: 'ADA Up or Down 5m',
    iconColor: '#0033ad',
    currentPrice: 0.9523,
    priceToBeat: 0.951,
    upPrice: 0.67,
    downPrice: 0.34,
    upPercent: 67,
    volume: '$156K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the ADA price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the ADA price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'avax-up-down-5m',
    symbol: 'AVAX',
    name: 'Avalanche',
    title: 'AVAX Up or Down 5m',
    iconColor: '#e84142',
    currentPrice: 35.67,
    priceToBeat: 35.5,
    upPrice: 0.74,
    downPrice: 0.27,
    upPercent: 74,
    volume: '$289K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the AVAX price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the AVAX price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'matic-up-down-5m',
    symbol: 'MATIC',
    name: 'Polygon',
    title: 'MATIC Up or Down 5m',
    iconColor: '#8247e5',
    currentPrice: 0.4821,
    priceToBeat: 0.481,
    upPrice: 0.58,
    downPrice: 0.43,
    upPercent: 58,
    volume: '$134K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the MATIC price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the MATIC price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'link-up-down-5m',
    symbol: 'LINK',
    name: 'Chainlink',
    title: 'LINK Up or Down 5m',
    iconColor: '#375bd2',
    currentPrice: 18.74,
    priceToBeat: 18.65,
    upPrice: 0.81,
    downPrice: 0.2,
    upPercent: 81,
    volume: '$412K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the LINK price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the LINK price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'dot-up-down-5m',
    symbol: 'DOT',
    name: 'Polkadot',
    title: 'DOT Up or Down 5m',
    iconColor: '#e6007a',
    currentPrice: 7.28,
    priceToBeat: 7.25,
    upPrice: 0.63,
    downPrice: 0.38,
    upPercent: 63,
    volume: '$178K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the DOT price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the DOT price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'ltc-up-down-5m',
    symbol: 'LTC',
    name: 'Litecoin',
    title: 'LTC Up or Down 5m',
    iconColor: '#345d9d',
    currentPrice: 102.35,
    priceToBeat: 102.0,
    upPrice: 0.76,
    downPrice: 0.25,
    upPercent: 76,
    volume: '$245K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the LTC price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the LTC price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'uni-up-down-5m',
    symbol: 'UNI',
    name: 'Uniswap',
    title: 'UNI Up or Down 5m',
    iconColor: '#ff007a',
    currentPrice: 12.48,
    priceToBeat: 12.4,
    upPrice: 0.69,
    downPrice: 0.32,
    upPercent: 69,
    volume: '$203K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the UNI price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the UNI price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'atom-up-down-5m',
    symbol: 'ATOM',
    name: 'Cosmos',
    title: 'ATOM Up or Down 5m',
    iconColor: '#2e3148',
    currentPrice: 9.87,
    priceToBeat: 9.82,
    upPrice: 0.71,
    downPrice: 0.3,
    upPercent: 71,
    volume: '$167K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the ATOM price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the ATOM price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'near-up-down-5m',
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    title: 'NEAR Up or Down 5m',
    iconColor: '#00c08b',
    currentPrice: 5.64,
    priceToBeat: 5.6,
    upPrice: 0.64,
    downPrice: 0.37,
    upPercent: 64,
    volume: '$142K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the NEAR price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the NEAR price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'apt-up-down-5m',
    symbol: 'APT',
    name: 'Aptos',
    title: 'APT Up or Down 5m',
    iconColor: '#2dd8a7',
    currentPrice: 8.92,
    priceToBeat: 8.88,
    upPrice: 0.73,
    downPrice: 0.28,
    upPercent: 73,
    volume: '$221K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the APT price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the APT price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'arb-up-down-5m',
    symbol: 'ARB',
    name: 'Arbitrum',
    title: 'ARB Up or Down 5m',
    iconColor: '#28a0f0',
    currentPrice: 0.7234,
    priceToBeat: 0.722,
    upPrice: 0.56,
    downPrice: 0.45,
    upPercent: 56,
    volume: '$189K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the ARB price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the ARB price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'op-up-down-5m',
    symbol: 'OP',
    name: 'Optimism',
    title: 'OP Up or Down 5m',
    iconColor: '#ff0420',
    currentPrice: 1.856,
    priceToBeat: 1.85,
    upPrice: 0.62,
    downPrice: 0.39,
    upPercent: 62,
    volume: '$175K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the OP price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the OP price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'inj-up-down-5m',
    symbol: 'INJ',
    name: 'Injective',
    title: 'INJ Up or Down 5m',
    iconColor: '#01d4fa',
    currentPrice: 22.45,
    priceToBeat: 22.3,
    upPrice: 0.77,
    downPrice: 0.24,
    upPercent: 77,
    volume: '$298K',
    isLive: true,
    rules: [
      'Market resolves to "Up" if the INJ price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the INJ price at the end of the 5-minute window is lower than the price at the start.'
    ]
  },
  {
    slug: 'sui-up-down-5m',
    symbol: 'SUI',
    name: 'Sui',
    title: 'SUI Up or Down 5m',
    iconColor: '#6fbcf0',
    currentPrice: 3.47,
    priceToBeat: 3.45,
    upPrice: 0.68,
    downPrice: 0.33,
    upPercent: 68,
    volume: '$256K',
    isLive: false,
    rules: [
      'Market resolves to "Up" if the SUI price at the end of the 5-minute window is greater than or equal to the price at the start.',
      'Market resolves to "Down" if the SUI price at the end of the 5-minute window is lower than the price at the start.'
    ]
  }
];

function hydrateMarket(
  market: Omit<PricePredictionMarket, 'chartData' | 'orderBook'>
): PricePredictionMarket {
  return {
    ...market,
    chartData: generateChartData(market.currentPrice),
    orderBook: generateOrderBook(market.currentPrice)
  };
}

export const pricePredictionMarkets: PricePredictionMarket[] =
  BASE_MARKETS.map(hydrateMarket);

export function getPricePredictionMarket(
  slug: string
): PricePredictionMarket | undefined {
  const base = BASE_MARKETS.find((m) => m.slug === slug);
  return base ? hydrateMarket(base) : undefined;
}

export function getAllPricePredictionMarkets(): PricePredictionMarket[] {
  return pricePredictionMarkets;
}

export function formatCents(price: number): string {
  return `${Math.round(price * 100)}¢`;
}

export function formatUsd(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 4 : 2
  });
}

export function calculateWinAmount(stake: number, contractPrice: number): number {
  if (contractPrice <= 0) return 0;
  return Math.round((stake / contractPrice) * 100) / 100;
}

export const quickBetAmounts = [5, 25, 100] as const;
