import { config } from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  PredictionBalanceLedgerType as BalanceLedgerType,
  PredictionMarketCategory as MarketCategory,
  PredictionMarketStatus as MarketStatus,
  PredictionOutcomeType as OutcomeType,
  PredictionTradeSide as TradeSide,
  PrismaClient,
  Role,
} from "@/lib/prisma/generated/client"

const UserRole = {
  user: Role.USER,
  admin: Role.ADMIN,
} as const
type UserRole = (typeof UserRole)[keyof typeof UserRole]
import { solidPng } from "./solid-png"

const rootDir = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(rootDir, "..", ".env") })

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

type SeedMarket = {
  slug: string
  title: string
  description: string
  context?: string
  category: MarketCategory
  subcategory?: string
  tags: string[]
  status: MarketStatus
  resolutionDate: Date
  dateLabel?: string
  totalVolume: number
  liquidity: number
  trendingScore: number
  iconLabel: string
  probability: number
  changePercent: number
  createdAt: Date
  color: [number, number, number]
  groupSlug?: string
}

const CATEGORY_COLOR: Record<MarketCategory, [number, number, number]> = {
  politics: [15, 52, 96],
  crypto: [234, 88, 12],
  sports: [22, 163, 74],
  finance: [37, 99, 235],
  tech: [124, 58, 237],
  entertainment: [219, 39, 119],
  world: [13, 148, 136],
  commodities: [202, 138, 4],
}

function rulesFor(title: string, source: string): string {
  return `This market will resolve to "Yes" if ${title.replace(/\?$/, "")} is confirmed by ${source} by the resolution date. Otherwise this market will resolve to "No". If the source is unavailable or the outcome is ambiguous, the market may resolve based on a widely reported consensus from reputable outlets.`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(n: number): number {
  return Math.min(0.99, Math.max(0.01, n))
}

function historyPoints(
  start: Date,
  end: Date,
  endProb: number,
  changePercent: number,
  count = 48
): { timestamp: Date; probability: number }[] {
  const startProb = clamp01(endProb - changePercent / 100)
  const span = Math.max(end.getTime() - start.getTime(), 1)
  const points: { timestamp: Date; probability: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const wobble = Math.sin(i * 0.7) * 0.012 + Math.cos(i * 1.3) * 0.008
    points.push({
      timestamp: new Date(start.getTime() + span * t),
      probability: clamp01(lerp(startProb, endProb, t) + wobble * (1 - t)),
    })
  }
  const last = points.at(-1)
  if (last) {
    last.probability = endProb
  }
  return points
}

function orderBook(probability: number) {
  const yes = probability
  const no = 1 - probability
  const bidsYes = [0, 1, 2, 3].map((i) => ({
    outcomeType: OutcomeType.YES,
    side: TradeSide.BUY,
    price: Math.max(0.01, yes - 0.01 * (i + 1)),
    size: 12_000 - i * 1_800,
  }))
  const asksYes = [0, 1, 2, 3].map((i) => ({
    outcomeType: OutcomeType.YES,
    side: TradeSide.SELL,
    price: Math.min(0.99, yes + 0.01 * i),
    size: 9_500 - i * 1_200,
  }))
  const bidsNo = [0, 1, 2].map((i) => ({
    outcomeType: OutcomeType.NO,
    side: TradeSide.BUY,
    price: Math.max(0.01, no - 0.01 * (i + 1)),
    size: 8_000 - i * 1_100,
  }))
  const asksNo = [0, 1, 2].map((i) => ({
    outcomeType: OutcomeType.NO,
    side: TradeSide.SELL,
    price: Math.min(0.99, no + 0.01 * i),
    size: 7_200 - i * 900,
  }))
  return [...bidsYes, ...asksYes, ...bidsNo, ...asksNo]
}

const MOCK_SEED: SeedMarket[] = [
  {
    slug: "will-bitcoin-reach-200000-by-end-of-2026",
    title: "Will Bitcoin reach $200,000 by end of 2026?",
    description: rulesFor(
      "Bitcoin trades at or above $200,000 USD",
      "CoinDesk or Bloomberg"
    ),
    category: MarketCategory.crypto,
    tags: ["Bitcoin", "Crypto"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 151_930_000,
    liquidity: 12_400_000,
    trendingScore: 92,
    iconLabel: "CR",
    probability: 0.42,
    changePercent: 6.0,
    createdAt: new Date("2025-11-02T10:00:00.000Z"),
    color: CATEGORY_COLOR.crypto,
  },
  {
    slug: "will-the-fed-cut-rates-at-the-july-2026-meeting",
    title: "Will the Fed cut rates at the July 2026 meeting?",
    description: rulesFor(
      "the Federal Reserve cuts the federal funds rate at the July 2026 FOMC meeting",
      "the Federal Reserve"
    ),
    category: MarketCategory.finance,
    tags: ["Fed", "Rates"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-07-29T20:00:00.000Z"),
    totalVolume: 92_190_000,
    liquidity: 8_100_000,
    trendingScore: 88,
    iconLabel: "FI",
    probability: 0.58,
    changePercent: -4.3,
    createdAt: new Date("2026-01-15T14:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-the-sp-500-close-above-7000-in-2026",
    title: "Will the S&P 500 close above 7,000 in 2026?",
    description: rulesFor(
      "the S&P 500 closes at or above 7,000",
      "S&P Dow Jones Indices"
    ),
    category: MarketCategory.finance,
    tags: ["Equities", "S&P"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T21:00:00.000Z"),
    totalVolume: 88_740_000,
    liquidity: 9_550_000,
    trendingScore: 75,
    iconLabel: "FI",
    probability: 0.64,
    changePercent: 2.1,
    createdAt: new Date("2025-12-01T09:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-democrats-flip-the-us-house-in-2026",
    title: "Will Democrats flip the US House in 2026?",
    description: rulesFor(
      "Democrats hold a majority of seats in the US House after the 2026 midterms",
      "the Associated Press"
    ),
    category: MarketCategory.politics,
    tags: ["US", "Elections"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-11-03T23:59:59.000Z"),
    totalVolume: 71_450_000,
    liquidity: 6_800_000,
    trendingScore: 81,
    iconLabel: "PO",
    probability: 0.52,
    changePercent: -1.8,
    createdAt: new Date("2025-10-20T12:00:00.000Z"),
    color: CATEGORY_COLOR.politics,
  },
  {
    slug: "will-gold-close-above-3500-oz-in-2026",
    title: "Will gold close above $3,500/oz in 2026?",
    description: rulesFor(
      "spot gold closes at or above $3,500 per troy ounce",
      "LBMA or Bloomberg"
    ),
    category: MarketCategory.commodities,
    tags: ["Gold", "Commodities"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 64_320_000,
    liquidity: 5_200_000,
    trendingScore: 70,
    iconLabel: "CO",
    probability: 0.71,
    changePercent: 5.4,
    createdAt: new Date("2025-09-10T08:00:00.000Z"),
    color: CATEGORY_COLOR.commodities,
  },
  {
    slug: "will-openai-release-gpt-5-in-2026",
    title: "Will OpenAI release GPT-5 in 2026?",
    description: rulesFor(
      "OpenAI publicly releases a model branded GPT-5",
      "OpenAI"
    ),
    category: MarketCategory.tech,
    tags: ["AI", "OpenAI"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 58_910_000,
    liquidity: 7_300_000,
    trendingScore: 95,
    iconLabel: "TE",
    probability: 0.38,
    changePercent: 9.2,
    createdAt: new Date("2026-02-01T16:00:00.000Z"),
    color: CATEGORY_COLOR.tech,
  },
  {
    slug: "will-ethereum-flip-bitcoin-in-market-cap-by-2027",
    title: "Will Ethereum flip Bitcoin in market cap by 2027?",
    description: rulesFor(
      "Ethereum's circulating market cap exceeds Bitcoin's",
      "CoinMarketCap or CoinGecko"
    ),
    category: MarketCategory.crypto,
    tags: ["Ethereum", "Bitcoin"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 54_200_000,
    liquidity: 4_100_000,
    trendingScore: 55,
    iconLabel: "CR",
    probability: 0.12,
    changePercent: -2.5,
    createdAt: new Date("2025-08-15T11:00:00.000Z"),
    color: CATEGORY_COLOR.crypto,
  },
  {
    slug: "will-the-springboks-win-the-rugby-championship-2026",
    title: "Will the Springboks win the Rugby Championship 2026?",
    description: rulesFor(
      "South Africa wins the 2026 Rugby Championship",
      "World Rugby or SANZAAR"
    ),
    category: MarketCategory.sports,
    tags: ["Rugby", "Springboks"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-09-30T22:00:00.000Z"),
    totalVolume: 48_150_000,
    liquidity: 3_900_000,
    trendingScore: 68,
    iconLabel: "SP",
    probability: 0.71,
    changePercent: 3.2,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    color: CATEGORY_COLOR.sports,
  },
  {
    slug: "will-tesla-stock-hit-500-in-2026",
    title: "Will Tesla stock hit $500 in 2026?",
    description: rulesFor(
      "Tesla (TSLA) trades at or above $500",
      "Nasdaq"
    ),
    category: MarketCategory.finance,
    tags: ["Tesla", "Equities"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T21:00:00.000Z"),
    totalVolume: 42_880_000,
    liquidity: 5_600_000,
    trendingScore: 62,
    iconLabel: "FI",
    probability: 0.45,
    changePercent: 1.4,
    createdAt: new Date("2025-12-20T13:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-trump-win-the-2028-us-presidential-election",
    title: "Will Trump win the 2028 US Presidential election?",
    description: rulesFor(
      "Donald Trump is declared the winner of the 2028 US presidential election",
      "the Associated Press"
    ),
    category: MarketCategory.politics,
    tags: ["US", "Elections"],
    status: MarketStatus.open,
    resolutionDate: new Date("2028-11-07T23:59:59.000Z"),
    totalVolume: 39_670_000,
    liquidity: 11_200_000,
    trendingScore: 84,
    iconLabel: "PO",
    probability: 0.48,
    changePercent: -0.8,
    createdAt: new Date("2026-01-05T09:00:00.000Z"),
    color: CATEGORY_COLOR.politics,
  },
  {
    slug: "will-south-africas-repo-rate-drop-below-7-in-2026",
    title: "Will South Africa's repo rate drop below 7% in 2026?",
    description: rulesFor(
      "the SARB repo rate is below 7%",
      "the South African Reserve Bank"
    ),
    category: MarketCategory.finance,
    tags: ["SARB", "Rates"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-15T16:00:00.000Z"),
    totalVolume: 35_440_000,
    liquidity: 2_800_000,
    trendingScore: 72,
    iconLabel: "FI",
    probability: 0.62,
    changePercent: 4.1,
    createdAt: new Date("2026-02-14T08:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-apple-release-ar-glasses-in-2026",
    title: "Will Apple release AR glasses in 2026?",
    description: rulesFor(
      "Apple commercially releases AR glasses",
      "Apple"
    ),
    category: MarketCategory.tech,
    tags: ["Apple", "AR"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 31_220_000,
    liquidity: 4_450_000,
    trendingScore: 58,
    iconLabel: "TE",
    probability: 0.33,
    changePercent: -3.6,
    createdAt: new Date("2025-11-28T15:00:00.000Z"),
    color: CATEGORY_COLOR.tech,
  },
  {
    slug: "will-the-anc-win-an-outright-majority-in-2026",
    title: "Will the ANC win an outright majority in 2026?",
    description: rulesFor(
      "the ANC wins more than 50% of the national vote or National Assembly seats in 2026",
      "the Electoral Commission of South Africa"
    ),
    category: MarketCategory.politics,
    tags: ["South Africa", "Elections"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-11-30T22:00:00.000Z"),
    totalVolume: 28_900_000,
    liquidity: 2_100_000,
    trendingScore: 66,
    iconLabel: "PO",
    probability: 0.31,
    changePercent: -5.0,
    createdAt: new Date("2026-03-10T12:00:00.000Z"),
    color: CATEGORY_COLOR.politics,
  },
  {
    slug: "will-a-south-african-film-win-an-oscar-in-2027",
    title: "Will a South African film win an Oscar in 2027?",
    description: rulesFor(
      "a South African production wins a competitive Academy Award in 2027",
      "the Academy of Motion Picture Arts and Sciences"
    ),
    category: MarketCategory.entertainment,
    tags: ["Oscars", "Film"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-03-15T06:00:00.000Z"),
    totalVolume: 12_450_000,
    liquidity: 980_000,
    trendingScore: 40,
    iconLabel: "EN",
    probability: 0.18,
    changePercent: 1.2,
    createdAt: new Date("2026-04-01T18:00:00.000Z"),
    color: CATEGORY_COLOR.entertainment,
  },
  {
    slug: "will-brics-expand-to-15-members-by-end-of-2026",
    title: "Will BRICS expand to 15 members by end of 2026?",
    description: rulesFor(
      "BRICS has at least 15 full member states",
      "an official BRICS communiqué"
    ),
    category: MarketCategory.world,
    tags: ["BRICS", "Geopolitics"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 22_180_000,
    liquidity: 1_750_000,
    trendingScore: 61,
    iconLabel: "WO",
    probability: 0.55,
    changePercent: 2.8,
    createdAt: new Date("2025-10-05T10:00:00.000Z"),
    color: CATEGORY_COLOR.world,
  },
  {
    slug: "will-bafana-bafana-qualify-for-the-2026-world-cup",
    title: "Will Bafana Bafana qualify for the 2026 World Cup?",
    description: rulesFor(
      "South Africa qualifies for the 2026 FIFA World Cup",
      "FIFA"
    ),
    category: MarketCategory.sports,
    tags: ["Football", "World Cup"],
    status: MarketStatus.resolved,
    resolutionDate: new Date("2026-03-26T22:00:00.000Z"),
    totalVolume: 19_760_000,
    liquidity: 0,
    trendingScore: 30,
    iconLabel: "SP",
    probability: 1,
    changePercent: 6.5,
    createdAt: new Date("2025-06-01T09:00:00.000Z"),
    color: CATEGORY_COLOR.sports,
  },
  {
    slug: "will-solana-flip-ethereum-by-market-cap-in-2025",
    title: "Will Solana flip Ethereum by market cap in 2025?",
    description: rulesFor(
      "Solana's circulating market cap exceeds Ethereum's during 2025",
      "CoinMarketCap or CoinGecko"
    ),
    category: MarketCategory.crypto,
    tags: ["Solana", "Ethereum"],
    status: MarketStatus.resolved,
    resolutionDate: new Date("2025-12-31T23:59:59.000Z"),
    totalVolume: 41_200_000,
    liquidity: 0,
    trendingScore: 20,
    iconLabel: "CR",
    probability: 0,
    changePercent: -12.0,
    createdAt: new Date("2025-01-10T12:00:00.000Z"),
    color: CATEGORY_COLOR.crypto,
  },
  {
    slug: "will-taylor-swift-announce-a-world-tour-in-2026",
    title: "Will Taylor Swift announce a world tour in 2026?",
    description: rulesFor(
      "Taylor Swift or her official representatives announce a 2026 world tour",
      "Taylor Swift's official channels or Billboard"
    ),
    category: MarketCategory.entertainment,
    tags: ["Music", "Taylor Swift"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 27_650_000,
    liquidity: 3_200_000,
    trendingScore: 77,
    iconLabel: "EN",
    probability: 0.44,
    changePercent: 3.7,
    createdAt: new Date("2026-03-20T20:00:00.000Z"),
    color: CATEGORY_COLOR.entertainment,
  },
  {
    slug: "will-a-ceasefire-hold-in-ukraine-through-2026",
    title: "Will a ceasefire hold in Ukraine through 2026?",
    description: rulesFor(
      "a ceasefire in Ukraine remains in effect through 31 December 2026",
      "the UN or mutually corroborating reporting from Reuters and AP"
    ),
    category: MarketCategory.world,
    tags: ["Ukraine", "Geopolitics"],
    status: MarketStatus.open,
    resolutionDate: new Date("2026-12-31T23:59:59.000Z"),
    totalVolume: 67_880_000,
    liquidity: 8_900_000,
    trendingScore: 90,
    iconLabel: "WO",
    probability: 0.29,
    changePercent: -2.1,
    createdAt: new Date("2026-02-28T07:00:00.000Z"),
    color: CATEGORY_COLOR.world,
  },
  {
    slug: "will-oil-brent-trade-above-100-barrel-in-2026",
    title: "Will oil (Brent) trade above $100/barrel in 2026?",
    description: rulesFor(
      "Brent crude trades above $100 per barrel during 2026",
      "ICE or Bloomberg"
    ),
    category: MarketCategory.commodities,
    tags: ["Oil", "Brent"],
    status: MarketStatus.resolved,
    resolutionDate: new Date("2026-01-31T23:59:59.000Z"),
    totalVolume: 33_100_000,
    liquidity: 0,
    trendingScore: 25,
    iconLabel: "CO",
    probability: 0,
    changePercent: -8.4,
    createdAt: new Date("2025-04-12T11:00:00.000Z"),
    color: CATEGORY_COLOR.commodities,
  },
]

const HORMUZ_GROUP_SLUG = "strait-of-hormuz-traffic-returns-to-normal"
const HORMUZ_CONTEXT =
  "The Strait of Hormuz is a critical chokepoint for global oil shipping. Markets in this group track whether traffic through the strait returns to typical throughput, as measured by IMF PortWatch tanker flow, by each listed date."

const HORMUZ_DATES: {
  slug: string
  dateLabel: string
  resolutionDate: Date
  probability: number
  changePercent: number
  volume: number
  createdAt: Date
}[] = [
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-august-31",
    dateLabel: "Aug 31",
    resolutionDate: new Date("2026-08-31T23:59:59.000Z"),
    probability: 0.05,
    changePercent: -1.1,
    volume: 1_120_000,
    createdAt: new Date("2026-06-02T12:00:00.000Z"),
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-september-15",
    dateLabel: "Sep 15",
    resolutionDate: new Date("2026-09-15T23:59:59.000Z"),
    probability: 0.08,
    changePercent: -2.4,
    volume: 2_040_000,
    createdAt: new Date("2026-06-02T12:00:00.000Z"),
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-september-30",
    dateLabel: "Sep 30",
    resolutionDate: new Date("2026-09-30T23:59:59.000Z"),
    probability: 0.11,
    changePercent: -4.3,
    volume: 3_627_055,
    createdAt: new Date("2026-06-02T12:00:00.000Z"),
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-october-31",
    dateLabel: "Oct 31",
    resolutionDate: new Date("2026-10-31T23:59:59.000Z"),
    probability: 0.18,
    changePercent: 1.6,
    volume: 2_880_000,
    createdAt: new Date("2026-06-02T12:00:00.000Z"),
  },
]

/** Default password for all seeded credential accounts (see console output). */
const SEED_PASSWORD = "password123"
const SEED_STARTING_BALANCE = 10_000

const COMMENT_USERS = [
  {
    email: "whalefolio@example.com",
    name: "Whalefolio",
    username: "Whalefolio",
    color: [56, 189, 248] as [number, number, number],
    role: UserRole.user,
  },
  {
    email: "0xabc@example.com",
    name: "0xabc123ef",
    username: "0xabc123ef",
    color: [244, 114, 182] as [number, number, number],
    role: UserRole.user,
  },
  {
    email: "0xbe54c@example.com",
    name: "0xBE54c",
    username: "0xBE54c",
    color: [250, 204, 21] as [number, number, number],
    role: UserRole.user,
  },
  {
    email: "ofunds@example.com",
    name: "ofunds",
    username: "ofunds",
    color: [52, 211, 153] as [number, number, number],
    role: UserRole.user,
  },
]

const ADMIN_USER = {
  email: "admin@example.com",
  name: "Admin",
  username: "admin",
  color: [15, 23, 42] as [number, number, number],
  role: UserRole.admin,
}

async function upsertUser(input: {
  email: string
  name: string
  username: string
  color: [number, number, number]
  role: UserRole
  passwordHash: string
  balance: number
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      username: input.username,
      predictionAvatar: solidPng(...input.color),
      predictionAvatarMimeType: "image/png",
      password: input.passwordHash,
      role: input.role,
      predictionBalance: input.balance,
    },
    create: {
      email: input.email,
      name: input.name,
      username: input.username,
      predictionAvatar: solidPng(...input.color),
      predictionAvatarMimeType: "image/png",
      password: input.passwordHash,
      role: input.role,
      predictionBalance: input.balance,
    },
  })

  await prisma.predictionBalanceLedger.create({
    data: {
      userId: user.id,
      amount: input.balance,
      balanceAfter: input.balance,
      type: BalanceLedgerType.seed,
      note: "Seed starting balance",
    },
  })

  return user
}

async function createMarket(seed: SeedMarket, groupId?: string) {
  const yesPrice =
    seed.status === MarketStatus.resolved
      ? seed.probability
      : clamp01(seed.probability)
  const noPrice = Number((1 - yesPrice).toFixed(4))
  const image = solidPng(...seed.color)

  const market = await prisma.predictionMarket.create({
    data: {
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      context: seed.context,
      category: seed.category,
      subcategory: seed.subcategory,
      tags: seed.tags,
      status: seed.status,
      resolutionDate: seed.resolutionDate,
      dateLabel: seed.dateLabel,
      totalVolume: seed.totalVolume,
      liquidity: seed.liquidity,
      trendingScore: seed.trendingScore,
      iconLabel: seed.iconLabel,
      image,
      imageMimeType: "image/png",
      groupId,
      createdAt: seed.createdAt,
      outcomes: {
        create: [
          { type: OutcomeType.YES, currentPrice: yesPrice },
          { type: OutcomeType.NO, currentPrice: noPrice },
        ],
      },
      orderBookLevels: {
        create: orderBook(yesPrice),
      },
    },
    include: { outcomes: true },
  })

  const yes = market.outcomes.find((o) => o.type === OutcomeType.YES)
  const no = market.outcomes.find((o) => o.type === OutcomeType.NO)
  if (!yes || !no) {
    throw new Error(`Outcomes missing for ${seed.slug}`)
  }

  const points = historyPoints(
    seed.createdAt,
    seed.status === MarketStatus.resolved ? seed.resolutionDate : new Date(),
    yesPrice,
    seed.changePercent
  )

  await prisma.predictionPriceHistory.createMany({
    data: [
      ...points.map((point) => ({
        marketId: market.id,
        outcomeId: yes.id,
        probability: point.probability,
        timestamp: point.timestamp,
      })),
      ...points.map((point) => ({
        marketId: market.id,
        outcomeId: no.id,
        probability: clamp01(1 - point.probability),
        timestamp: point.timestamp,
      })),
    ],
  })

  return market
}

async function seedHormuzComments(
  marketId: string,
  outcomeYesId: string,
  users: Awaited<ReturnType<typeof upsertUser>>[]
) {
  const [whale, abc, be54, ofunds] = users
  if (!whale || !abc || !be54 || !ofunds) {
    return
  }

  await prisma.predictionTrade.createMany({
    data: [
      {
        userId: whale.id,
        marketId,
        outcomeId: outcomeYesId,
        side: TradeSide.BUY,
        amount: 4200,
        shares: 38_200,
        priceAtTrade: 0.11,
        createdAt: new Date("2026-08-16T21:00:00.000Z"),
      },
      {
        userId: be54.id,
        marketId,
        outcomeId: outcomeYesId,
        side: TradeSide.SELL,
        amount: 360,
        shares: 40,
        priceAtTrade: 0.11,
        createdAt: new Date("2026-08-16T18:00:00.000Z"),
      },
    ],
  })

  const parent = await prisma.predictionComment.create({
    data: {
      userId: whale.id,
      marketId,
      content:
        "Tanker flows still well below the 90-day average. IMF PortWatch would need a sharp rebound in September for Yes to have a shot.",
      likes: 24,
      createdAt: new Date("2026-08-16T22:10:00.000Z"),
    },
  })

  await prisma.predictionComment.create({
    data: {
      userId: abc.id,
      marketId,
      parentId: parent.id,
      content: "Agree — insurance quotes still imply elevated disruption risk.",
      likes: 6,
      createdAt: new Date("2026-08-16T23:40:00.000Z"),
    },
  })

  await prisma.predictionComment.createMany({
    data: [
      {
        userId: be54.id,
        marketId,
        content: "No is free money unless traffic prints a V-shape recovery.",
        likes: 11,
        createdAt: new Date("2026-08-17T00:15:00.000Z"),
      },
      {
        userId: ofunds.id,
        marketId,
        content:
          "Watching the Sep 30 contract vs Oct 31. Curve is still pricing a slow grind back to normal.",
        likes: 4,
        createdAt: new Date("2026-08-16T20:05:00.000Z"),
      },
    ],
  })
}

async function main() {
  await prisma.predictionBalanceLedger.deleteMany()
  await prisma.predictionComment.deleteMany()
  await prisma.predictionTrade.deleteMany()
  await prisma.predictionPriceHistory.deleteMany()
  await prisma.predictionOrderBookLevel.deleteMany()
  await prisma.predictionOutcome.deleteMany()
  await prisma.predictionMarket.deleteMany()
  await prisma.predictionMarketGroup.deleteMany()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)

  const admin = await upsertUser({
    ...ADMIN_USER,
    passwordHash,
    balance: SEED_STARTING_BALANCE,
  })

  const commentUsers = await Promise.all(
    COMMENT_USERS.map((user) =>
      upsertUser({
        ...user,
        passwordHash,
        balance: SEED_STARTING_BALANCE,
      })
    )
  )

  const hormuzGroup = await prisma.predictionMarketGroup.create({
    data: {
      slug: HORMUZ_GROUP_SLUG,
      title: "Strait of Hormuz traffic returns to normal",
    },
  })

  let hormuzSep: { id: string; outcomes: { id: string; type: OutcomeType }[] } | undefined

  for (const row of HORMUZ_DATES) {
    const monthName = row.dateLabel.includes("Aug")
      ? "August 31"
      : row.dateLabel.includes("Sep 15")
        ? "September 15"
        : row.dateLabel.includes("Sep 30")
          ? "September 30"
          : "October 31"
    const created = await createMarket(
      {
        slug: row.slug,
        title: `Strait of Hormuz traffic returns to normal by ${monthName}?`,
        description:
          "This market will resolve to \"Yes\" if IMF PortWatch publishes that Strait of Hormuz tanker traffic has returned to within 10% of the prior 90-day average by the listed date (UTC). Otherwise this market will resolve to \"No\". If PortWatch data is delayed, the next official publication covering the resolution date will be used.",
        context: HORMUZ_CONTEXT,
        category: MarketCategory.commodities,
        subcategory: "oil",
        tags: ["Iran", "Oil"],
        status: MarketStatus.open,
        resolutionDate: row.resolutionDate,
        dateLabel: row.dateLabel,
        totalVolume: row.volume,
        liquidity: row.volume * 0.08,
        trendingScore: row.slug.includes("september-30") ? 99 : 80,
        iconLabel: "HZ",
        probability: row.probability,
        changePercent: row.changePercent,
        createdAt: row.createdAt,
        color: [14, 116, 144],
      },
      hormuzGroup.id
    )

    if (row.slug.includes("september-30")) {
      hormuzSep = created
    }
  }

  for (const market of MOCK_SEED) {
    await createMarket(market)
  }

  if (hormuzSep) {
    const yes = hormuzSep.outcomes.find((o) => o.type === OutcomeType.YES)
    if (yes) {
      await seedHormuzComments(hormuzSep.id, yes.id, commentUsers)
    }
  }

  console.log(
    `Seeded ${HORMUZ_DATES.length + MOCK_SEED.length} markets, ${commentUsers.length + 1} users (balance $${SEED_STARTING_BALANCE}).`
  )
  console.log(
    `Admin login: ${admin.email} / ${SEED_PASSWORD} → /admin/market`
  )
  console.log(
    `Demo trader: ${COMMENT_USERS[0]?.email} / ${SEED_PASSWORD}`
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
