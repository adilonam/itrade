import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/polymarket/ui/accordion"
import { formatCents, formatUsdVolume } from "@/components/polymarket/markets/data"
import { OutcomeType } from "@/lib/polymarket/db-types"
import type { OrderBookRow } from "@/lib/polymarket/markets/queries"

export function OrderBook({ levels }: { levels: OrderBookRow[] }) {
  const yesBids = levels
    .filter((row) => row.outcomeType === OutcomeType.YES && row.side === "BUY")
    .sort((a, b) => b.price - a.price)
  const yesAsks = levels
    .filter((row) => row.outcomeType === OutcomeType.YES && row.side === "SELL")
    .sort((a, b) => a.price - b.price)
  const hasLevels = yesBids.length > 0 || yesAsks.length > 0

  return (
    <Accordion
      className="border-outline-variant mb-6 rounded-xl bg-surface-white"
      defaultValue={hasLevels ? ["order-book"] : []}
    >
      <AccordionItem value="order-book">
        <AccordionTrigger className="font-label text-sm">
          Order Book
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-success-green mb-2 font-semibold">Bids</div>
              {yesBids.length === 0 ? (
                <p className="text-secondary py-2">No bids</p>
              ) : (
                yesBids.map((row) => (
                  <div
                    key={row.id}
                    className="flex justify-between py-1 font-data"
                  >
                    <span>{formatCents(row.price)}</span>
                    <span className="text-secondary">
                      {formatUsdVolume(row.size)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div>
              <div className="text-danger-red mb-2 font-semibold">Asks</div>
              {yesAsks.length === 0 ? (
                <p className="text-secondary py-2">No asks</p>
              ) : (
                yesAsks.map((row) => (
                  <div
                    key={row.id}
                    className="flex justify-between py-1 font-data"
                  >
                    <span>{formatCents(row.price)}</span>
                    <span className="text-secondary">
                      {formatUsdVolume(row.size)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
