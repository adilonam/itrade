import { MarketsPage } from "@/components/polymarket/markets/markets-page"
import { listMarketCards } from "@/lib/polymarket/markets/queries"

export const dynamic = "force-dynamic"

export default async function Page() {
  const markets = await listMarketCards()
  return <MarketsPage markets={markets} />
}
