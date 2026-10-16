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
config({ path: path.join(rootDir, "..", "..", ".env") })

/** Platform release day used as the default createdAt anchor for seeded markets. */
const RELEASE_DAY = new Date("2027-06-15T12:00:00.000Z")

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
  // Politics (3)
  {
    slug: "will-democrats-control-the-us-senate-after-2027-specials",
    title: "Will Democrats control the US Senate after 2027 special elections?",
    description: rulesFor(
      "Democrats hold a majority of US Senate seats after any 2027 special elections concluded by the resolution date",
      "the Associated Press"
    ),
    category: MarketCategory.politics,
    tags: ["US", "Senate"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 71_450_000,
    liquidity: 6_800_000,
    trendingScore: 81,
    iconLabel: "PO",
    probability: 0.47,
    changePercent: -1.8,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.politics,
  },
  {
    slug: "will-the-anc-lead-a-majority-coalition-through-2027",
    title: "Will the ANC lead a majority coalition through end of 2027?",
    description: rulesFor(
      "the ANC remains the lead party in a governing coalition with a National Assembly majority through 31 December 2027",
      "the Electoral Commission of South Africa or Parliament of South Africa"
    ),
    category: MarketCategory.politics,
    tags: ["South Africa", "ANC"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T22:00:00.000Z"),
    totalVolume: 28_900_000,
    liquidity: 2_100_000,
    trendingScore: 66,
    iconLabel: "PO",
    probability: 0.54,
    changePercent: 2.4,
    createdAt: new Date("2027-06-15T14:00:00.000Z"),
    color: CATEGORY_COLOR.politics,
  },
  {
    slug: "will-uk-hold-a-general-election-in-2027",
    title: "Will the UK hold a general election in 2027?",
    description: rulesFor(
      "a UK general election is held during calendar year 2027",
      "the UK Electoral Commission or Parliament"
    ),
    category: MarketCategory.politics,
    tags: ["UK", "Elections"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 39_670_000,
    liquidity: 4_200_000,
    trendingScore: 73,
    iconLabel: "PO",
    probability: 0.28,
    changePercent: -0.8,
    createdAt: new Date("2027-06-16T09:00:00.000Z"),
    color: CATEGORY_COLOR.politics,
  },
  // Crypto (3)
  {
    slug: "will-bitcoin-reach-200000-by-end-of-2027",
    title: "Will Bitcoin reach $200,000 by end of 2027?",
    description: rulesFor(
      "Bitcoin trades at or above $200,000 USD",
      "CoinDesk or Bloomberg"
    ),
    category: MarketCategory.crypto,
    tags: ["Bitcoin", "Crypto"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 151_930_000,
    liquidity: 12_400_000,
    trendingScore: 92,
    iconLabel: "CR",
    probability: 0.42,
    changePercent: 6.0,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.crypto,
  },
  {
    slug: "will-ethereum-flip-bitcoin-in-market-cap-by-end-of-2027",
    title: "Will Ethereum flip Bitcoin in market cap by end of 2027?",
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
    createdAt: new Date("2027-06-15T11:00:00.000Z"),
    color: CATEGORY_COLOR.crypto,
  },
  {
    slug: "will-solana-etf-see-10b-aum-by-end-of-2027",
    title: "Will a Solana ETF reach $10B AUM by end of 2027?",
    description: rulesFor(
      "a US-listed Solana spot ETF reports at least $10 billion in assets under management",
      "Bloomberg or the ETF issuer filings"
    ),
    category: MarketCategory.crypto,
    tags: ["Solana", "ETF"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 41_200_000,
    liquidity: 3_600_000,
    trendingScore: 64,
    iconLabel: "CR",
    probability: 0.35,
    changePercent: 4.2,
    createdAt: new Date("2027-06-18T12:00:00.000Z"),
    color: CATEGORY_COLOR.crypto,
  },
  // Sports (3)
  {
    slug: "will-the-springboks-win-the-rugby-championship-2027",
    title: "Will the Springboks win the Rugby Championship 2027?",
    description: rulesFor(
      "South Africa wins the 2027 Rugby Championship",
      "World Rugby or SANZAAR"
    ),
    category: MarketCategory.sports,
    tags: ["Rugby", "Springboks"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-09-30T22:00:00.000Z"),
    totalVolume: 48_150_000,
    liquidity: 3_900_000,
    trendingScore: 68,
    iconLabel: "SP",
    probability: 0.71,
    changePercent: 3.2,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.sports,
  },
  {
    slug: "will-the-springboks-win-rugby-world-cup-2027",
    title: "Will the Springboks win Rugby World Cup 2027?",
    description: rulesFor(
      "South Africa wins the 2027 Rugby World Cup",
      "World Rugby"
    ),
    category: MarketCategory.sports,
    tags: ["Rugby", "World Cup"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-11-13T22:00:00.000Z"),
    totalVolume: 19_760_000,
    liquidity: 1_850_000,
    trendingScore: 82,
    iconLabel: "SP",
    probability: 0.39,
    changePercent: 1.5,
    createdAt: new Date("2027-06-16T09:00:00.000Z"),
    color: CATEGORY_COLOR.sports,
  },
  {
    slug: "will-a-south-african-win-wimbledon-singles-2027",
    title: "Will a South African win a Wimbledon singles title in 2027?",
    description: rulesFor(
      "a South African player wins the gentlemen's or ladies' singles title at Wimbledon 2027",
      "the All England Lawn Tennis Club"
    ),
    category: MarketCategory.sports,
    tags: ["Tennis", "Wimbledon"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-07-16T20:00:00.000Z"),
    totalVolume: 12_400_000,
    liquidity: 980_000,
    trendingScore: 44,
    iconLabel: "SP",
    probability: 0.08,
    changePercent: -0.5,
    createdAt: new Date("2027-06-20T10:00:00.000Z"),
    color: CATEGORY_COLOR.sports,
  },
  // Finance (3)
  {
    slug: "will-the-fed-cut-rates-at-the-july-2027-meeting",
    title: "Will the Fed cut rates at the July 2027 meeting?",
    description: rulesFor(
      "the Federal Reserve cuts the federal funds rate at the July 2027 FOMC meeting",
      "the Federal Reserve"
    ),
    category: MarketCategory.finance,
    tags: ["Fed", "Rates"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-07-28T20:00:00.000Z"),
    totalVolume: 92_190_000,
    liquidity: 8_100_000,
    trendingScore: 88,
    iconLabel: "FI",
    probability: 0.58,
    changePercent: -4.3,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-the-sp-500-close-above-7500-in-2027",
    title: "Will the S&P 500 close above 7,500 in 2027?",
    description: rulesFor(
      "the S&P 500 closes at or above 7,500 on any trading day in 2027",
      "S&P Dow Jones Indices"
    ),
    category: MarketCategory.finance,
    tags: ["Equities", "S&P"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T21:00:00.000Z"),
    totalVolume: 88_740_000,
    liquidity: 9_550_000,
    trendingScore: 75,
    iconLabel: "FI",
    probability: 0.61,
    changePercent: 2.1,
    createdAt: new Date("2027-06-15T09:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  {
    slug: "will-south-africas-repo-rate-drop-below-65-in-2027",
    title: "Will South Africa's repo rate drop below 6.5% in 2027?",
    description: rulesFor(
      "the SARB repo rate is below 6.5%",
      "the South African Reserve Bank"
    ),
    category: MarketCategory.finance,
    tags: ["SARB", "Rates"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-15T16:00:00.000Z"),
    totalVolume: 35_440_000,
    liquidity: 2_800_000,
    trendingScore: 72,
    iconLabel: "FI",
    probability: 0.52,
    changePercent: 4.1,
    createdAt: new Date("2027-06-17T08:00:00.000Z"),
    color: CATEGORY_COLOR.finance,
  },
  // Tech (3)
  {
    slug: "will-openai-release-gpt-5-in-2027",
    title: "Will OpenAI release GPT-5 in 2027?",
    description: rulesFor(
      "OpenAI publicly releases a model branded GPT-5",
      "OpenAI"
    ),
    category: MarketCategory.tech,
    tags: ["AI", "OpenAI"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 58_910_000,
    liquidity: 7_300_000,
    trendingScore: 95,
    iconLabel: "TE",
    probability: 0.48,
    changePercent: 9.2,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.tech,
  },
  {
    slug: "will-apple-release-ar-glasses-in-2027",
    title: "Will Apple release AR glasses in 2027?",
    description: rulesFor(
      "Apple commercially releases AR glasses",
      "Apple"
    ),
    category: MarketCategory.tech,
    tags: ["Apple", "AR"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 31_220_000,
    liquidity: 4_450_000,
    trendingScore: 58,
    iconLabel: "TE",
    probability: 0.33,
    changePercent: -3.6,
    createdAt: new Date("2027-06-15T15:00:00.000Z"),
    color: CATEGORY_COLOR.tech,
  },
  {
    slug: "will-a-humanoid-robot-ship-100k-units-in-2027",
    title: "Will any humanoid robot ship 100,000 units in 2027?",
    description: rulesFor(
      "a commercially available humanoid robot product ships at least 100,000 units during 2027",
      "the manufacturer or corroborated reporting from Reuters and Bloomberg"
    ),
    category: MarketCategory.tech,
    tags: ["Robotics", "Hardware"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 24_500_000,
    liquidity: 2_900_000,
    trendingScore: 70,
    iconLabel: "TE",
    probability: 0.22,
    changePercent: 5.1,
    createdAt: new Date("2027-06-19T16:00:00.000Z"),
    color: CATEGORY_COLOR.tech,
  },
  // Entertainment (3)
  {
    slug: "will-a-south-african-film-win-an-oscar-in-2027",
    title: "Will a South African film win an Oscar in 2027?",
    description: rulesFor(
      "a South African production wins a competitive Academy Award at the 2027 ceremony",
      "the Academy of Motion Picture Arts and Sciences"
    ),
    category: MarketCategory.entertainment,
    tags: ["Oscars", "Film"],
    status: MarketStatus.resolved,
    resolutionDate: new Date("2027-03-15T06:00:00.000Z"),
    totalVolume: 12_450_000,
    liquidity: 0,
    trendingScore: 25,
    iconLabel: "EN",
    probability: 0,
    changePercent: -4.2,
    createdAt: new Date("2027-01-10T18:00:00.000Z"),
    color: CATEGORY_COLOR.entertainment,
  },
  {
    slug: "will-taylor-swift-announce-a-world-tour-in-2027",
    title: "Will Taylor Swift announce a world tour in 2027?",
    description: rulesFor(
      "Taylor Swift or her official representatives announce a 2027 world tour",
      "Taylor Swift's official channels or Billboard"
    ),
    category: MarketCategory.entertainment,
    tags: ["Music", "Taylor Swift"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 27_650_000,
    liquidity: 3_200_000,
    trendingScore: 77,
    iconLabel: "EN",
    probability: 0.44,
    changePercent: 3.7,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.entertainment,
  },
  {
    slug: "will-gta-vi-sell-50m-copies-in-2027",
    title: "Will GTA VI sell 50 million copies in 2027?",
    description: rulesFor(
      "Grand Theft Auto VI reports at least 50 million copies sold during calendar year 2027",
      "Take-Two Interactive or Rockstar"
    ),
    category: MarketCategory.entertainment,
    tags: ["Gaming", "GTA"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 45_800_000,
    liquidity: 5_100_000,
    trendingScore: 85,
    iconLabel: "EN",
    probability: 0.57,
    changePercent: 6.8,
    createdAt: new Date("2027-06-16T20:00:00.000Z"),
    color: CATEGORY_COLOR.entertainment,
  },
  // World (3)
  {
    slug: "will-brics-expand-to-15-members-by-end-of-2027",
    title: "Will BRICS expand to 15 members by end of 2027?",
    description: rulesFor(
      "BRICS has at least 15 full member states",
      "an official BRICS communiqué"
    ),
    category: MarketCategory.world,
    tags: ["BRICS", "Geopolitics"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 22_180_000,
    liquidity: 1_750_000,
    trendingScore: 61,
    iconLabel: "WO",
    probability: 0.55,
    changePercent: 2.8,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.world,
  },
  {
    slug: "will-a-ceasefire-hold-in-ukraine-through-2027",
    title: "Will a ceasefire hold in Ukraine through 2027?",
    description: rulesFor(
      "a ceasefire in Ukraine remains in effect through 31 December 2027",
      "the UN or mutually corroborating reporting from Reuters and AP"
    ),
    category: MarketCategory.world,
    tags: ["Ukraine", "Geopolitics"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 67_880_000,
    liquidity: 8_900_000,
    trendingScore: 90,
    iconLabel: "WO",
    probability: 0.29,
    changePercent: -2.1,
    createdAt: new Date("2027-06-15T07:00:00.000Z"),
    color: CATEGORY_COLOR.world,
  },
  {
    slug: "will-cop32-agree-a-binding-plastic-treaty-in-2027",
    title: "Will COP32 agree a binding plastics treaty in 2027?",
    description: rulesFor(
      "parties at COP32 adopt a legally binding global plastics treaty",
      "the UNFCCC or UNEP official outcome documents"
    ),
    category: MarketCategory.world,
    tags: ["Climate", "COP"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-11-30T23:59:59.000Z"),
    totalVolume: 18_300_000,
    liquidity: 1_420_000,
    trendingScore: 52,
    iconLabel: "WO",
    probability: 0.36,
    changePercent: 1.9,
    createdAt: new Date("2027-06-21T10:00:00.000Z"),
    color: CATEGORY_COLOR.world,
  },
  // Commodities (3 standalone; Hormuz group adds more)
  {
    slug: "will-gold-close-above-4000-oz-in-2027",
    title: "Will gold close above $4,000/oz in 2027?",
    description: rulesFor(
      "spot gold closes at or above $4,000 per troy ounce on any day in 2027",
      "LBMA or Bloomberg"
    ),
    category: MarketCategory.commodities,
    tags: ["Gold", "Commodities"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 64_320_000,
    liquidity: 5_200_000,
    trendingScore: 70,
    iconLabel: "CO",
    probability: 0.63,
    changePercent: 5.4,
    createdAt: RELEASE_DAY,
    color: CATEGORY_COLOR.commodities,
  },
  {
    slug: "will-oil-brent-trade-above-100-barrel-in-2027",
    title: "Will oil (Brent) trade above $100/barrel in 2027?",
    description: rulesFor(
      "Brent crude trades above $100 per barrel during 2027",
      "ICE or Bloomberg"
    ),
    category: MarketCategory.commodities,
    tags: ["Oil", "Brent"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 33_100_000,
    liquidity: 2_750_000,
    trendingScore: 63,
    iconLabel: "CO",
    probability: 0.41,
    changePercent: -3.2,
    createdAt: new Date("2027-06-15T11:00:00.000Z"),
    color: CATEGORY_COLOR.commodities,
  },
  {
    slug: "will-copper-hit-12000-tonne-in-2027",
    title: "Will copper hit $12,000/tonne in 2027?",
    description: rulesFor(
      "LME copper trades at or above $12,000 per tonne during 2027",
      "the London Metal Exchange or Bloomberg"
    ),
    category: MarketCategory.commodities,
    tags: ["Copper", "Metals"],
    status: MarketStatus.open,
    resolutionDate: new Date("2027-12-31T23:59:59.000Z"),
    totalVolume: 21_600_000,
    liquidity: 1_900_000,
    trendingScore: 49,
    iconLabel: "CO",
    probability: 0.46,
    changePercent: 2.7,
    createdAt: new Date("2027-06-18T08:00:00.000Z"),
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
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-august-31-2027",
    dateLabel: "Aug 31",
    resolutionDate: new Date("2027-08-31T23:59:59.000Z"),
    probability: 0.05,
    changePercent: -1.1,
    volume: 1_120_000,
    createdAt: RELEASE_DAY,
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-september-15-2027",
    dateLabel: "Sep 15",
    resolutionDate: new Date("2027-09-15T23:59:59.000Z"),
    probability: 0.08,
    changePercent: -2.4,
    volume: 2_040_000,
    createdAt: RELEASE_DAY,
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-september-30-2027",
    dateLabel: "Sep 30",
    resolutionDate: new Date("2027-09-30T23:59:59.000Z"),
    probability: 0.11,
    changePercent: -4.3,
    volume: 3_627_055,
    createdAt: RELEASE_DAY,
  },
  {
    slug: "strait-of-hormuz-traffic-returns-to-normal-by-october-31-2027",
    dateLabel: "Oct 31",
    resolutionDate: new Date("2027-10-31T23:59:59.000Z"),
    probability: 0.18,
    changePercent: 1.6,
    volume: 2_880_000,
    createdAt: RELEASE_DAY,
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

  const now = new Date()
  const historyEnd =
    seed.status === MarketStatus.resolved
      ? seed.resolutionDate
      : seed.createdAt.getTime() > now.getTime()
        ? new Date(seed.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
        : now

  const points = historyPoints(
    seed.createdAt,
    historyEnd,
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
        createdAt: new Date("2027-08-16T21:00:00.000Z"),
      },
      {
        userId: be54.id,
        marketId,
        outcomeId: outcomeYesId,
        side: TradeSide.SELL,
        amount: 360,
        shares: 40,
        priceAtTrade: 0.11,
        createdAt: new Date("2027-08-16T18:00:00.000Z"),
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
      createdAt: new Date("2027-08-16T22:10:00.000Z"),
    },
  })

  await prisma.predictionComment.create({
    data: {
      userId: abc.id,
      marketId,
      parentId: parent.id,
      content: "Agree — insurance quotes still imply elevated disruption risk.",
      likes: 6,
      createdAt: new Date("2027-08-16T23:40:00.000Z"),
    },
  })

  await prisma.predictionComment.createMany({
    data: [
      {
        userId: be54.id,
        marketId,
        content: "No is free money unless traffic prints a V-shape recovery.",
        likes: 11,
        createdAt: new Date("2027-08-17T00:15:00.000Z"),
      },
      {
        userId: ofunds.id,
        marketId,
        content:
          "Watching the Sep 30 contract vs Oct 31. Curve is still pricing a slow grind back to normal.",
        likes: 4,
        createdAt: new Date("2027-08-16T20:05:00.000Z"),
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

  const byCategory = MOCK_SEED.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1
    return acc
  }, {})
  byCategory.commodities =
    (byCategory.commodities ?? 0) + HORMUZ_DATES.length

  const totalMarkets = HORMUZ_DATES.length + MOCK_SEED.length
  console.log(
    `Seeded ${totalMarkets} markets, ${commentUsers.length + 1} users (balance $${SEED_STARTING_BALANCE}).`
  )
  console.log(`Release day anchor: ${RELEASE_DAY.toISOString().slice(0, 10)}`)
  console.log(`Per category: ${JSON.stringify(byCategory)}`)
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
