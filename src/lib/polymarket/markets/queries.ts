import { unstable_noStore as noStore } from "next/cache"

import {
  resolveAdminPagination,
  type AdminPaginatedResult,
  type AdminPaginationInput,
} from "@/lib/polymarket/admin/pagination"
import type { TradeBalanceType } from "@/lib/balance-selection"
import { MarketCategory, OutcomeType, prisma, type Prisma } from "@/lib/polymarket/db"
import {
  houseProfitsForMarket,
  type TradeForHouseProfit,
} from "@/lib/polymarket/markets/house-profit"
import { toMarketListItem, type MarketListItem } from "@/lib/polymarket/markets/map"
import { marketImageSrc, userAvatarSrc } from "@/lib/polymarket/markets/images"

const marketCardInclude = {
  outcomes: {
    select: {
      type: true,
      currentPrice: true,
    },
  },
  priceHistory: {
    where: { outcome: { type: OutcomeType.YES } },
    orderBy: { timestamp: "asc" as const },
    select: { probability: true },
    take: 1,
  },
} satisfies Prisma.PredictionMarketInclude

const adminMarketSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  context: true,
  status: true,
  winningOutcome: true,
  category: true,
  tags: true,
  resolutionDate: true,
  dateLabel: true,
  iconLabel: true,
  totalVolume: true,
  imageMimeType: true,
  outcomes: {
    select: {
      type: true,
      currentPrice: true,
    },
  },
} satisfies Prisma.PredictionMarketSelect

type AdminMarketRow = Prisma.PredictionMarketGetPayload<{ select: typeof adminMarketSelect }>

/** Admin markets table rows with hypothetical house profit if Yes / No wins. */
export type AdminMarketListItem = Omit<
  AdminMarketRow,
  "resolutionDate" | "outcomes" | "imageMimeType"
> & {
  resolutionDate: string
  yesPrice: number
  noPrice: number
  imageUrl: string | null
  tradeCount: number
  profitIfYes: number
  profitIfNo: number
  profitIfYesReal: number
  profitIfYesDemo: number
  profitIfNoReal: number
  profitIfNoDemo: number
}

export type ListAdminMarketsOptions = AdminPaginationInput & {
  /** Case-insensitive contains filter on market string fields (and exact tag / category). */
  q?: string
}

function buildAdminMarketWhere(q?: string): Prisma.PredictionMarketWhereInput | undefined {
  const query = q?.trim()
  if (!query) {
    return undefined
  }

  const or: Prisma.PredictionMarketWhereInput[] = [
    { title: { contains: query, mode: "insensitive" } },
    { slug: { contains: query, mode: "insensitive" } },
    { description: { contains: query, mode: "insensitive" } },
    { context: { contains: query, mode: "insensitive" } },
    { subcategory: { contains: query, mode: "insensitive" } },
    { dateLabel: { contains: query, mode: "insensitive" } },
    { iconLabel: { contains: query, mode: "insensitive" } },
    { tags: { has: query } },
  ]

  const categoryMatch = (Object.values(MarketCategory) as MarketCategory[]).find(
    (value) => value.toLowerCase() === query.toLowerCase()
  )
  if (categoryMatch) {
    or.push({ category: categoryMatch })
  }

  return { OR: or }
}

export async function listAdminMarkets(
  options: ListAdminMarketsOptions
): Promise<AdminPaginatedResult<AdminMarketListItem>> {
  noStore()
  const where = buildAdminMarketWhere(options.q)
  const totalCount = await prisma.predictionMarket.count({ where })
  const { page, pageSize, totalPages, skip, take } = resolveAdminPagination(
    totalCount,
    { page: options.page, pageSize: options.pageSize }
  )

  if (totalCount === 0) {
    return { items: [], totalCount, page, pageSize, totalPages }
  }

  const markets = await prisma.predictionMarket.findMany({
    where,
    orderBy: [{ status: "asc" }, { trendingScore: "desc" }, { title: "asc" }],
    select: adminMarketSelect,
    skip,
    take,
  })

  const trades = await prisma.predictionTrade.findMany({
    where: { marketId: { in: markets.map((market) => market.id) } },
    select: {
      marketId: true,
      userId: true,
      side: true,
      amount: true,
      shares: true,
      balanceType: true,
      outcome: { select: { type: true } },
    },
  })

  const tradesByMarket = new Map<string, TradeForHouseProfit[]>()

  for (const trade of trades) {
    const list = tradesByMarket.get(trade.marketId) ?? []
    list.push({
      userId: trade.userId,
      side: trade.side,
      amount: trade.amount,
      shares: trade.shares,
      balanceType: trade.balanceType as TradeBalanceType,
      outcomeType: trade.outcome.type,
    })
    tradesByMarket.set(trade.marketId, list)
  }

  const items = markets.map((market) => {
    const marketTrades = tradesByMarket.get(market.id) ?? []
    const profits = houseProfitsForMarket(marketTrades)
    const yes = market.outcomes.find((o) => o.type === OutcomeType.YES)
    const no = market.outcomes.find((o) => o.type === OutcomeType.NO)
    return {
      id: market.id,
      slug: market.slug,
      title: market.title,
      description: market.description,
      context: market.context,
      status: market.status,
      winningOutcome: market.winningOutcome,
      category: market.category,
      tags: market.tags,
      resolutionDate: market.resolutionDate.toISOString(),
      dateLabel: market.dateLabel,
      iconLabel: market.iconLabel,
      totalVolume: market.totalVolume,
      yesPrice: yes?.currentPrice ?? 0.5,
      noPrice: no?.currentPrice ?? 0.5,
      imageUrl: market.imageMimeType ? marketImageSrc(market.id) : null,
      tradeCount: marketTrades.length,
      profitIfYes: profits.profitIfYes,
      profitIfNo: profits.profitIfNo,
      profitIfYesReal: profits.real.profitIfYes,
      profitIfYesDemo: profits.demo.profitIfYes,
      profitIfNoReal: profits.real.profitIfNo,
      profitIfNoDemo: profits.demo.profitIfNo,
    }
  })

  return { items, totalCount, page, pageSize, totalPages }
}

const adminTradeInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
    },
  },
  market: {
    select: {
      id: true,
      slug: true,
      title: true,
    },
  },
  outcome: {
    select: {
      type: true,
    },
  },
  balanceLedgers: {
    select: { amount: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
} satisfies Prisma.PredictionTradeInclude

type AdminTradeRow = Prisma.PredictionTradeGetPayload<{ include: typeof adminTradeInclude }>

/** Serialized admin trades table row (ISO dates + ledger impact). */
export type AdminTradeListItem = {
  id: AdminTradeRow["id"]
  createdAt: string
  side: AdminTradeRow["side"]
  amount: AdminTradeRow["amount"]
  shares: AdminTradeRow["shares"]
  priceAtTrade: AdminTradeRow["priceAtTrade"]
  balanceType: TradeBalanceType
  balanceImpact: number | null
  user: AdminTradeRow["user"]
  market: AdminTradeRow["market"]
  outcome: Pick<AdminTradeRow["outcome"], "type">
}

const adminMarketOptionSelect = {
  id: true,
  title: true,
} satisfies Prisma.PredictionMarketSelect

export type AdminMarketOption = Prisma.PredictionMarketGetPayload<{
  select: typeof adminMarketOptionSelect
}>

/** Recent trades for admin, optionally filtered by market and/or balance type. */
export async function listAdminTrades(options: {
  marketId?: string
  balanceType?: TradeBalanceType
  page: number
  pageSize: number
}): Promise<AdminPaginatedResult<AdminTradeListItem>> {
  noStore()
  const marketId = options.marketId
  const balanceType = options.balanceType
  const where: Prisma.PredictionTradeWhereInput = {
    ...(marketId ? { marketId } : {}),
    ...(balanceType ? { balanceType } : {}),
  }

  const totalCount = await prisma.predictionTrade.count({ where })
  const { page, pageSize, totalPages, skip, take } = resolveAdminPagination(
    totalCount,
    { page: options.page, pageSize: options.pageSize }
  )

  if (totalCount === 0) {
    return { items: [], totalCount, page, pageSize, totalPages }
  }

  const trades = await prisma.predictionTrade.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: adminTradeInclude,
  })

  const items = trades.map((trade) => ({
    id: trade.id,
    createdAt: trade.createdAt.toISOString(),
    side: trade.side,
    amount: trade.amount,
    shares: trade.shares,
    priceAtTrade: trade.priceAtTrade,
    balanceType: trade.balanceType as TradeBalanceType,
    balanceImpact: trade.balanceLedgers[0]?.amount ?? null,
    user: trade.user,
    market: trade.market,
    outcome: { type: trade.outcome.type },
  }))

  return { items, totalCount, page, pageSize, totalPages }
}

/** Lightweight market list for admin trade filter dropdown. */
export async function listAdminMarketOptions(): Promise<AdminMarketOption[]> {
  noStore()
  return prisma.predictionMarket.findMany({
    orderBy: { title: "asc" },
    select: adminMarketOptionSelect,
  })
}

/** Resolve a market id for the admin trades filter banner. */
export async function getAdminMarketById(
  marketId: string
): Promise<AdminMarketOption | null> {
  noStore()
  return prisma.predictionMarket.findUnique({
    where: { id: marketId },
    select: adminMarketOptionSelect,
  })
}

export async function listMarketCards(): Promise<MarketListItem[]> {
  noStore()
  const markets = await prisma.predictionMarket.findMany({
    omit: { image: true },
    include: marketCardInclude,
    orderBy: { totalVolume: "desc" },
  })
  return markets.map(toMarketListItem)
}

export async function listFeaturedMarketCards(
  take = 4
): Promise<MarketListItem[]> {
  noStore()
  const markets = await prisma.predictionMarket.findMany({
    omit: { image: true },
    include: marketCardInclude,
    where: { status: "open" },
    orderBy: { trendingScore: "desc" },
    take,
  })
  return markets.map(toMarketListItem)
}

export async function countMarketsByCategory() {
  noStore()
  const groups = await prisma.predictionMarket.groupBy({
    by: ["category"],
    _count: { _all: true },
  })
  return groups.map((group) => ({
    category: group.category,
    count: group._count._all,
  }))
}

export type PricePoint = {
  timestamp: string
  probability: number
}

export type OrderBookRow = {
  id: string
  outcomeType: OutcomeType
  side: "BUY" | "SELL"
  price: number
  size: number
}

export type SiblingMarket = {
  id: string
  slug: string
  dateLabel: string | null
  resolutionDate: string
}

export type RelatedMarket = MarketListItem & { tags: string[] }

export type CommentView = {
  id: string
  content: string
  likes: number
  createdAt: string
  parentId: string | null
  author: {
    id: string
    name: string | null
    username: string | null
    avatarUrl: string | null
  }
  positionLabel: string | null
  replies: CommentView[]
}

export type HolderView = {
  userId: string
  name: string | null
  username: string | null
  avatarUrl: string | null
  outcome: OutcomeType
  shares: number
  balanceType: TradeBalanceType
}

export type ActivityView = {
  id: string
  createdAt: string
  side: "BUY" | "SELL"
  amount: number
  shares: number
  priceAtTrade: number
  outcome: OutcomeType
  balanceType: TradeBalanceType
  userName: string | null
  username: string | null
}

export type PositionView = {
  outcome: OutcomeType
  shares: number
  balanceType: TradeBalanceType
}

export type MarketDetail = {
  id: string
  slug: string
  title: string
  description: string
  context: string | null
  category: MarketListItem["category"]
  subcategory: string | null
  tags: string[]
  status: MarketListItem["status"]
  winningOutcome: OutcomeType | null
  resolutionDate: string
  dateLabel: string | null
  volume: number
  liquidity: number
  iconLabel: string | null
  imageUrl: string | null
  yesPrice: number
  noPrice: number
  changePercent: number
  groupTitle: string | null
  siblings: SiblingMarket[]
  history: PricePoint[]
  orderBook: OrderBookRow[]
  comments: CommentView[]
  related: RelatedMarket[]
  holders: HolderView[]
  activity: ActivityView[]
}

function formatShareLabel(shares: number, outcome: OutcomeType): string {
  const abs = Math.abs(shares)
  const qty =
    abs >= 1000
      ? `${(abs / 1000).toFixed(abs >= 10_000 ? 1 : 1).replace(/\.0$/, "")}K`
      : abs >= 10
        ? abs.toFixed(0)
        : abs.toFixed(1)
  return `${qty} ${outcome}`
}

function positionKey(userId: string, balanceType: TradeBalanceType): string {
  return `${userId}:${balanceType}`
}

function netPositions(
  trades: {
    userId: string
    side: "BUY" | "SELL"
    shares: number
    balanceType: TradeBalanceType
    outcome: { type: OutcomeType }
    user: {
      id: string
      name: string | null
      username: string | null
      predictionAvatarMimeType: string | null
    }
  }[]
) {
  const map = new Map<
    string,
    {
      yes: number
      no: number
      balanceType: TradeBalanceType
      user: (typeof trades)[number]["user"]
    }
  >()
  for (const trade of trades) {
    const key = positionKey(trade.userId, trade.balanceType)
    const entry = map.get(key) ?? {
      yes: 0,
      no: 0,
      balanceType: trade.balanceType,
      user: trade.user,
    }
    const delta = trade.side === "BUY" ? trade.shares : -trade.shares
    if (trade.outcome.type === OutcomeType.YES) {
      entry.yes += delta
    } else {
      entry.no += delta
    }
    map.set(key, entry)
  }
  return map
}

export async function getMarketDetail(
  slug: string
): Promise<MarketDetail | null> {
  noStore()
  const market = await prisma.predictionMarket.findUnique({
    where: { slug },
    omit: { image: true },
    include: {
      outcomes: true,
      group: {
        include: {
          markets: {
            orderBy: { resolutionDate: "asc" },
            select: {
              id: true,
              slug: true,
              dateLabel: true,
              resolutionDate: true,
            },
          },
        },
      },
      priceHistory: {
        where: { outcome: { type: OutcomeType.YES } },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true, probability: true },
      },
      orderBookLevels: {
        orderBy: [{ price: "asc" }],
      },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              predictionAvatarMimeType: true,
            },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  predictionAvatarMimeType: true,
                },
              },
            },
          },
        },
      },
      trades: {
        orderBy: { createdAt: "desc" },
        include: {
          outcome: { select: { type: true } },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              predictionAvatarMimeType: true,
            },
          },
        },
      },
    },
  })

  if (!market) {
    return null
  }

  const loaded = market
  const card = toMarketListItem({
    ...loaded,
    outcomes: loaded.outcomes,
    priceHistory: loaded.priceHistory,
  })

  const relatedRows = await prisma.predictionMarket.findMany({
    omit: { image: true },
    include: marketCardInclude,
    where: {
      id: { not: loaded.id },
      status: "open",
      OR: [
        { category: loaded.category },
        { tags: { hasSome: loaded.tags } },
      ],
    },
    orderBy: { trendingScore: "desc" },
    take: 8,
  })

  const positions = netPositions(
    loaded.trades.map((trade) => ({
      ...trade,
      balanceType: trade.balanceType as TradeBalanceType,
    }))
  )
  type MarketComment = (typeof loaded.comments)[number]
  type MarketReply = MarketComment["replies"][number]

  function commentNetForUser(userId: string) {
    let yes = 0
    let no = 0
    for (const balanceType of ["REAL", "DEMO"] as const) {
      const entry = positions.get(positionKey(userId, balanceType))
      if (!entry) continue
      yes += entry.yes
      no += entry.no
    }
    return { yes, no }
  }

  function commentView(comment: MarketComment | MarketReply): CommentView {
    const net = commentNetForUser(comment.userId)
    let positionLabel: string | null = null
    if (net.yes > 0.05) {
      positionLabel = formatShareLabel(net.yes, OutcomeType.YES)
    } else if (net.no > 0.05 || net.yes < -0.05) {
      const shares = net.no > 0 ? net.no : Math.abs(net.yes)
      positionLabel = formatShareLabel(shares, OutcomeType.NO)
    }
    const replies =
      "replies" in comment
        ? comment.replies.map((reply) => commentView(reply))
        : []
    return {
      id: comment.id,
      content: comment.content,
      likes: comment.likes,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      author: {
        id: comment.user.id,
        name: comment.user.name,
        username: comment.user.username,
        avatarUrl: comment.user.predictionAvatarMimeType
          ? userAvatarSrc(comment.user.id)
          : null,
      },
      positionLabel,
      replies,
    }
  }

  const holders: HolderView[] = Array.from(positions.entries())
    .map(([key, entry]) => {
      const yes = entry.yes
      const no = entry.no
      if (yes <= 0 && no <= 0) {
        return null
      }
      const outcome = yes >= no ? OutcomeType.YES : OutcomeType.NO
      const shares = outcome === OutcomeType.YES ? yes : no
      const userId = key.split(":")[0] ?? entry.user.id
      return {
        userId,
        name: entry.user.name,
        username: entry.user.username,
        avatarUrl: entry.user.predictionAvatarMimeType
          ? userAvatarSrc(entry.user.id)
          : null,
        outcome,
        shares,
        balanceType: entry.balanceType,
      }
    })
    .filter((row): row is HolderView => row !== null)
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 30)

  return {
    id: market.id,
    slug: market.slug,
    title: market.title,
    description: market.description,
    context: market.context,
    category: market.category,
    subcategory: market.subcategory,
    tags: market.tags,
    status: market.status,
    winningOutcome: market.winningOutcome,
    resolutionDate: market.resolutionDate.toISOString(),
    dateLabel: market.dateLabel,
    volume: market.totalVolume,
    liquidity: market.liquidity,
    iconLabel: market.iconLabel,
    imageUrl: card.imageUrl,
    yesPrice: card.yesPrice,
    noPrice: card.noPrice,
    changePercent: card.changePercent,
    groupTitle: market.group?.title ?? null,
    siblings: (market.group?.markets ?? []).map((sibling) => ({
      id: sibling.id,
      slug: sibling.slug,
      dateLabel: sibling.dateLabel,
      resolutionDate: sibling.resolutionDate.toISOString(),
    })),
    history: market.priceHistory.map((point) => ({
      timestamp: point.timestamp.toISOString(),
      probability: point.probability,
    })),
    orderBook: market.orderBookLevels.map((level) => ({
      id: level.id,
      outcomeType: level.outcomeType,
      side: level.side,
      price: level.price,
      size: level.size,
    })),
    comments: market.comments.map((comment) => commentView(comment)),
    related: relatedRows.map((row) => ({
      ...toMarketListItem(row),
      tags: row.tags,
    })),
    holders,
    activity: market.trades.slice(0, 40).map((trade) => ({
      id: trade.id,
      createdAt: trade.createdAt.toISOString(),
      side: trade.side,
      amount: trade.amount,
      shares: trade.shares,
      priceAtTrade: trade.priceAtTrade,
      outcome: trade.outcome.type,
      balanceType: trade.balanceType as TradeBalanceType,
      userName: trade.user.name,
      username: trade.user.username,
    })),
  }
}

export async function getUserPositions(
  userId: string,
  marketId: string
): Promise<PositionView[]> {
  noStore()
  const trades = await prisma.predictionTrade.findMany({
    where: { userId, marketId },
    include: { outcome: { select: { type: true } } },
  })

  const nets = new Map<
    string,
    { yes: number; no: number; balanceType: TradeBalanceType }
  >()

  for (const trade of trades) {
    const balanceType = trade.balanceType as TradeBalanceType
    const key = balanceType
    const entry = nets.get(key) ?? { yes: 0, no: 0, balanceType }
    const delta = trade.side === "BUY" ? trade.shares : -trade.shares
    if (trade.outcome.type === OutcomeType.YES) {
      entry.yes += delta
    } else {
      entry.no += delta
    }
    nets.set(key, entry)
  }

  const rows: PositionView[] = []
  for (const entry of Array.from(nets.values())) {
    if (entry.yes > 0.0001) {
      rows.push({
        outcome: OutcomeType.YES,
        shares: entry.yes,
        balanceType: entry.balanceType,
      })
    }
    if (entry.no > 0.0001) {
      rows.push({
        outcome: OutcomeType.NO,
        shares: entry.no,
        balanceType: entry.balanceType,
      })
    }
  }
  return rows
}
