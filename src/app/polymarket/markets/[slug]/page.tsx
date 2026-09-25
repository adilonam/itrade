import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { auth } from "@/lib/polymarket/auth-session"
import { MarketDetailView } from "@/components/polymarket/market-detail/market-detail-view"
import { OutcomeType, TradeSide } from "@/lib/polymarket/db-types"
import { getMarketDetail, getUserPositions } from "@/lib/polymarket/markets/queries"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ action?: string; outcome?: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const market = await getMarketDetail(slug)
  return {
    title: market ? market.title : "Market",
  }
}

export default async function MarketPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const [query, market, session] = await Promise.all([
    searchParams,
    getMarketDetail(slug),
    auth(),
  ])
  if (!market) {
    notFound()
  }

  const userId = session?.user?.id
  const positions = userId ? await getUserPositions(userId, market.id) : []
  const initialSide =
    query.action?.toLowerCase() === "sell" ? TradeSide.SELL : TradeSide.BUY
  const initialOutcome =
    query.outcome?.toUpperCase() === "NO" ? OutcomeType.NO : OutcomeType.YES

  return (
    <MarketDetailView
      market={market}
      signedIn={Boolean(userId)}
      positions={positions}
      initialSide={initialSide}
      initialOutcome={initialOutcome}
    />
  )
}
