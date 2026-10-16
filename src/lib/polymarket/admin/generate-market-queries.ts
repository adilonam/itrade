import { unstable_noStore as noStore } from "next/cache"

import { OutcomeType, prisma, type Prisma } from "@/lib/polymarket/db"
import { marketImageSrc } from "@/lib/polymarket/markets/images"

const manageSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  context: true,
  category: true,
  tags: true,
  status: true,
  resolutionDate: true,
  dateLabel: true,
  iconLabel: true,
  imageMimeType: true,
  createdAt: true,
  outcomes: {
    select: {
      type: true,
      currentPrice: true,
    },
  },
} satisfies Prisma.PredictionMarketSelect

type ManageRow = Prisma.PredictionMarketGetPayload<{ select: typeof manageSelect }>

export type ManageableMarket = Omit<
  ManageRow,
  "resolutionDate" | "createdAt" | "outcomes" | "imageMimeType"
> & {
  resolutionDate: string
  createdAt: string
  yesPrice: number
  noPrice: number
  imageUrl: string | null
}

function toManageable(market: ManageRow): ManageableMarket {
  const yes = market.outcomes.find((o) => o.type === OutcomeType.YES)
  const no = market.outcomes.find((o) => o.type === OutcomeType.NO)
  return {
    id: market.id,
    slug: market.slug,
    title: market.title,
    description: market.description,
    context: market.context,
    category: market.category,
    tags: market.tags,
    status: market.status,
    resolutionDate: market.resolutionDate.toISOString(),
    dateLabel: market.dateLabel,
    iconLabel: market.iconLabel,
    createdAt: market.createdAt.toISOString(),
    yesPrice: yes?.currentPrice ?? 0.5,
    noPrice: no?.currentPrice ?? 0.5,
    imageUrl: market.imageMimeType ? marketImageSrc(market.id) : null,
  }
}

export async function listManageableMarkets(): Promise<ManageableMarket[]> {
  noStore()
  const markets = await prisma.predictionMarket.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: manageSelect,
  })
  return markets.map(toManageable)
}

export async function getManageableMarket(
  id: string
): Promise<ManageableMarket | null> {
  noStore()
  const market = await prisma.predictionMarket.findUnique({
    where: { id },
    select: manageSelect,
  })
  return market ? toManageable(market) : null
}
