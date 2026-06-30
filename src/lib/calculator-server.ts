'use server';

import { twelveDataService } from '@/lib/twelvedata';
import { prisma } from '@/lib/prisma';
import {
  Market,
  Position,
  MarketType
} from '@/lib/prisma/generated/client';
import type { BalanceType, User } from '@/lib/prisma/generated/client';
import { getUserBalanceAmount } from '@/lib/balance';

type UserWithBalance = Pick<User, 'id' | 'leverage'> & { balance: number };

/**
 * Get lot size based on market type
 * @param type - The type of market (FOREX, STOCKS, etc.)
 * @returns Lot size multiplier
 */
export async function getLotSize(type: MarketType): Promise<number> {
  switch (type) {
    case 'FOREX':
      return 100000;
    case 'STOCKS':
      return 100;
    default:
      return 1;
  }
}

/**
 * Calculate PnL for a position based on executed price and closed price
 * This function calculates profit/loss based on the position type and actual prices.
 *
 * @param position - Position with market information, executedPrice, and closedPrice
 * @returns Calculated PnL or null if calculation fails
 */
export async function calculatePositionPnL(
  position: Position & {
    market: Market;
  }
): Promise<number | null> {
  try {
    // Only calculate PnL for BUY/SELL positions with market data
    if (!position.market || !['BUY', 'SELL'].includes(position.type)) {
      return null;
    }

    const quantity = position.quantity;

    // Use executed price from position (don't change it)
    const executedPrice = position.executedPrice;
    if (!executedPrice || executedPrice <= 0) {
      return null;
    }

    // Get current price (bid or ask based on position type)
    let currentPrice: number | null = null;

    if (position.closedPrice && position.closedPrice > 0) {
      // If position is closed, use the closed price
      currentPrice = position.closedPrice;
    } else {
      // For open positions, refresh market data and calculate current price
      const refreshedMarkets = await refreshSaveMarkets([
        position.market as Market
      ]);
      if (refreshedMarkets && refreshedMarkets.length > 0) {
        // Calculate bid/ask prices based on market spread
        const market = position.market;
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;

        // Exit price: BUY closes at bid, SELL closes at ask
        currentPrice = position.type === 'BUY' ? bidPrice : askPrice;
      } else {
        return null;
      }
    }

    // If we can't get current price, return null
    if (currentPrice === null) {
      return null;
    }

    // Calculate PnL based on position type
    let pnl: number;
    // For STOCK room, always use lot size of 1
    const lotSize =
      position.room === 'STOCK' || position.market.room === 'STOCK'
        ? 1
        : await getLotSize(position.market.type);

    if (position.type === 'BUY') {
      // For BUY: PnL = (current_price - executed_price) * quantity
      pnl = (currentPrice - executedPrice) * quantity * lotSize;
    } else if (position.type === 'SELL') {
      // For SELL: PnL = (executed_price - current_price) * quantity
      pnl = (executedPrice - currentPrice) * quantity * lotSize;
    } else {
      return null;
    }

    return pnl;
  } catch {
    return null;
  }
}

/**
 * Calculate PnL for multiple positions
 * @param positions - Array of positions with market information
 * @returns Array of positions with calculated PnL
 */
export async function calculatePositionsPnL(
  positions: (Position & {
    market: {
      id: string;
      symbol: string;
      name: string;
      type: string;
      lastPrice?: number;
    } | null;
  })[]
): Promise<
  (Position & {
    market: {
      id: string;
      symbol: string;
      name: string;
      type: string;
      lastPrice?: number;
    } | null;
    calculatedPnL: number | null;
  })[]
> {
  const positionsWithPnL = await Promise.all(
    positions.map(async (position) => {
      const calculatedPnL = await calculatePositionPnL(
        position as Position & {
          market: Market;
        }
      );
      return {
        ...position,
        calculatedPnL
      };
    })
  );

  return positionsWithPnL;
}

/**
 * Refresh market data from TwelveData API and save to database
 * @param markets - Array of market objects to refresh
 * @param refreshAll - Whether to refresh all markets (default: false)
 * @returns Array of markets with refreshed data or null if refresh fails
 */
export async function refreshSaveMarkets(
  markets?: Market[],
  refreshAll: boolean = false
): Promise<Market[] | null> {
  try {
    let marketsToRefresh: Market[] = [];

    if (refreshAll) {
      // Get all visible markets
      marketsToRefresh = await prisma.market.findMany({
        where: { visible: true }
      });
    } else if (markets && markets.length > 0) {
      // Use provided markets directly
      marketsToRefresh = markets;
    } else {
      return null;
    }

    if (marketsToRefresh.length === 0) {
      return [];
    }

    // Refresh market data using getCombinedData and save to database
    const refreshedMarkets = await Promise.all(
      marketsToRefresh.map(async (market) => {
        try {
          // const twelveDataSymbol = toTwelveDataSymbol(market);
          const marketData = await twelveDataService.getCombinedData(
            market.symbol
          );

          if ('error' in marketData) {
            return market; // Return original market if API fails
          }

          // Update market with fresh data from API
          const updatedMarket = await prisma.market.update({
            where: { id: market.id },
            data: {
              lastPrice: parseFloat(marketData.current_price),
              lastChange: parseFloat(marketData.change),
              lastPercentChange: parseFloat(marketData.percent_change),
              lastPreviousClose: parseFloat(marketData.previous_close),
              updatedAt: new Date()
            }
          });

          return updatedMarket;
        } catch {
          return market; // Return original market if refresh fails
        }
      })
    );

    return refreshedMarkets;
  } catch {
    return null;
  }
}

/**
 * Calculate required margin for a position based on user leverage, position price and quantity
 * @param position - Position object with user relation, quantity and executedPrice
 * @returns Required margin amount or null if calculation fails
 */
export async function calculateRequiredMargin(
  position: Position & { user: UserWithBalance; market: Market }
): Promise<number | null> {
  try {
    // Validate inputs
    if (!position || !position.user) {
      return null;
    }

    // Always use executedPrice as the position price
    if (!position.executedPrice || position.executedPrice <= 0) {
      return null;
    }

    const positionPrice = position.executedPrice;

    // Calculate position value (price * quantity * lot size)
    // For STOCK room, always use lot size of 1
    const lotSize =
      position.room === 'STOCK' || position.market.room === 'STOCK'
        ? 1
        : await getLotSize(position.market.type);
    const positionValue = positionPrice * position.quantity * lotSize;

    // Calculate required margin based on leverage
    // Required Margin = Position Value / Leverage
    // For stock room, always use leverage = 1, otherwise use user's leverage
    const leverage =
      position.market.room === 'STOCK' ? 1 : position.user.leverage || 1;
    const requiredMargin = positionValue / leverage;

    return requiredMargin;
  } catch {
    return null;
  }
}

/**
 * Calculate comprehensive financial information for a user
 * @param user - User object from Prisma with id, balance, and leverage
 * @param room - Room filter (STOCK, TRADING, or ALL). Defaults to ALL.
 * @returns Object containing balance, margins, equity, PnL, and leverage
 */
export async function calculateUserFinancialInfo(
  user: Pick<User, 'id' | 'leverage'>,
  room: 'STOCK' | 'TRADING' | 'ALL' = 'ALL',
  balanceType: BalanceType = 'REAL'
): Promise<{
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
} | null> {
  try {
    if (!user) {
      return null;
    }

    // Build where clause for positions (scoped to the selected wallet)
    const whereClause: {
      userId: string;
      status: 'PLACED';
      room?: 'STOCK' | 'TRADING' | { in: ('STOCK' | 'TRADING')[] };
      userBalance: { type: BalanceType };
    } = {
      userId: user.id,
      status: 'PLACED',
      userBalance: { type: balanceType }
    };

    // Filter by room if specified (not ALL)
    if (room !== 'ALL') {
      whereClause.room = room;
    } else {
      whereClause.room = { in: ['STOCK', 'TRADING'] };
    }

    // Get PLACED positions for the user on this wallet (filtered by room if specified)
    const placedPositions = await prisma.position.findMany({
      where: whereClause,
      include: {
        market: true
      }
    });

    // Get all unique markets from user positions
    const marketMap = new Map();
    placedPositions.forEach((pos) => {
      if (pos.market) {
        marketMap.set(pos.market.id, pos.market);
      }
    });

    const markets = Array.from(marketMap.values());

    // Refresh market data for all unique markets
    const refreshedMarkets =
      markets.length > 0 ? await refreshSaveMarkets(markets) : null;
    const marketDataMap = new Map<string, Market>();
    if (refreshedMarkets) {
      refreshedMarkets.forEach((market) => {
        marketDataMap.set(market.id, market);
      });
    }

    // Calculate total PnL and used margin
    let totalPnL = 0;
    let usedMargin = 0;

    // Calculate PnL for each PLACED position
    for (const position of placedPositions) {
      if (
        position.market &&
        position.executedPrice &&
        position.executedPrice > 0
      ) {
        const market =
          marketDataMap.get(position.market.id) ?? position.market;
        // Exit price: BUY closes at bid, SELL closes at ask (matches frontend)
        const midPrice = market.lastPrice ?? 0;
        const spread = market.spread ?? 0;
        const bidPrice = midPrice - spread / 2;
        const askPrice = midPrice + spread / 2;
        const currentPrice = position.type === 'BUY' ? bidPrice : askPrice;

        // Calculate PnL
        // For STOCK room, always use lot size of 1
        const lotSize =
          position.room === 'STOCK' || position.market.room === 'STOCK'
            ? 1
            : await getLotSize(position.market.type);

        let pnl = 0;
        if (position.type === 'BUY') {
          pnl =
            (currentPrice - position.executedPrice) *
            position.quantity *
            lotSize;
        } else if (position.type === 'SELL') {
          pnl =
            (position.executedPrice - currentPrice) *
            position.quantity *
            lotSize;
        }

        totalPnL += pnl;
      }

      // Sum up used margin
      usedMargin += position.requiredMargin || 0;
    }

    // Calculate financial metrics
    const balance = await prisma.$transaction((tx) =>
      getUserBalanceAmount(tx, user.id, balanceType)
    );
    const equity = balance + totalPnL;
    const freeMargin = equity - usedMargin;
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : null;

    return {
      balance: Number(balance.toFixed(2)),
      usedMargin: Number(usedMargin.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      freeMargin: Number(freeMargin.toFixed(2)),
      marginLevel: marginLevel !== null ? Number(marginLevel.toFixed(2)) : null,
      totalPnL: Number(totalPnL.toFixed(2)),
      leverage: user.leverage
    };
  } catch {
    return null;
  }
}

/**
 * Check if a user can open a new position based on their current positions, PnL, required margin, and leverage
 * @param position - The new position to potentially open (with user and market data)
 * @returns Object containing whether position can be opened and relevant calculations
 */
export async function couldOpenPosition(
  position: Position & { user: UserWithBalance; market: Market }
): Promise<{
  canOpen: boolean;
  freeMargin: number;
  totalPnL: number;
  totalRequiredMargin: number;
  newPositionRequiredMargin: number;
  leverage: number;
} | null> {
  try {
    const user = position.user;

    // Get all user positions with PLACED status from database (same wallet only)
    const placedWhere: {
      userId: string;
      status: 'PLACED';
      userBalanceId?: string;
    } = {
      userId: user.id,
      status: 'PLACED'
    };
    if (position.userBalanceId) {
      placedWhere.userBalanceId = position.userBalanceId;
    }

    const allUserPlacedPositions = await prisma.position.findMany({
      where: placedWhere,
      include: { market: true }
    });

    // Get all unique markets from user positions
    const marketMap = new Map();
    allUserPlacedPositions.forEach((pos) => {
      if (pos.market) {
        marketMap.set(pos.market.id, pos.market);
      }
    });

    // Add the market from the position parameter
    if (position.market) {
      marketMap.set(position.market.id, position.market);
    }

    const markets = Array.from(marketMap.values());

    // Refresh market data for all positions
    const refreshedMarkets = await refreshSaveMarkets(markets);
    if (!refreshedMarkets) {
      return null;
    }

    // Create a map of refreshed market data for quick lookup
    const marketDataMap = new Map();
    refreshedMarkets.forEach((market) => {
      marketDataMap.set(market.id, market);
    });

    // Calculate total PnL by manually calculating PnL for each position with refreshed data
    let totalPnL = 0;
    for (const pos of allUserPlacedPositions) {
      if (pos.market && pos.executedPrice && pos.executedPrice > 0) {
        const refreshedMarket = marketDataMap.get(pos.market.id);
        if (refreshedMarket) {
          // Exit price: BUY closes at bid, SELL closes at ask (matches frontend)
          const midPrice = refreshedMarket.lastPrice ?? 0;
          const spread = refreshedMarket.spread ?? 0;
          const bidPrice = midPrice - spread / 2;
          const askPrice = midPrice + spread / 2;
          const currentPrice = pos.type === 'BUY' ? bidPrice : askPrice;

          // Calculate PnL
          // For STOCK room, always use lot size of 1
          const lotSize =
            pos.room === 'STOCK' || pos.market.room === 'STOCK'
              ? 1
              : await getLotSize(pos.market.type);

          let pnl = 0;
          if (pos.type === 'BUY') {
            pnl = (currentPrice - pos.executedPrice) * pos.quantity * lotSize;
          } else if (pos.type === 'SELL') {
            pnl = (pos.executedPrice - currentPrice) * pos.quantity * lotSize;
          }

          totalPnL += pnl;
        }
      }
    }

    // Calculate total required margin from all active positions (PLACED)
    const totalRequiredMargin = allUserPlacedPositions.reduce((sum, pos) => {
      return sum + (pos.requiredMargin || 0);
    }, 0);

    // Calculate free margin: balance + total PnL - total required margin
    const freeMargin = user.balance + totalPnL - totalRequiredMargin;

    // Calculate required margin for the new position
    const newPositionRequiredMargin = await calculateRequiredMargin(position);
    if (newPositionRequiredMargin === null) {
      return null;
    }

    // Check if user has enough free margin to open the new position
    // Also consider leverage - with higher leverage, less margin is needed

    const canOpen = freeMargin >= newPositionRequiredMargin;

    // Determine leverage based on market room
    const effectiveLeverage =
      position.market.room === 'STOCK' ? 1 : user.leverage || 1;

    return {
      canOpen,
      freeMargin,
      totalPnL,
      totalRequiredMargin,
      newPositionRequiredMargin,
      leverage: effectiveLeverage
    };
  } catch {
    return null;
  }
}
