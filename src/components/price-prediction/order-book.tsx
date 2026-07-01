import type { PricePredictionMarket } from '@/lib/price-prediction/mock-data';
import { formatUsd } from '@/lib/price-prediction/mock-data';

type OrderBookProps = {
  orderBook: PricePredictionMarket['orderBook'];
};

export function OrderBook({ orderBook }: OrderBookProps) {
  return (
    <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
      <h3 className='mb-3 text-sm font-semibold text-trade-text'>Order Book</h3>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='mb-2 text-xs font-medium uppercase tracking-wide text-trade-green'>
            Bids
          </p>
          <table className='w-full text-xs'>
            <thead>
              <tr className='text-trade-text-muted'>
                <th className='pb-1 text-left font-medium'>Price</th>
                <th className='pb-1 text-right font-medium'>Size</th>
                <th className='pb-1 text-right font-medium'>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderBook.bids.map((level, i) => (
                <tr key={`bid-${i}`} className='text-trade-text'>
                  <td className='py-0.5 text-trade-green'>
                    {formatUsd(level.price)}
                  </td>
                  <td className='py-0.5 text-right'>{level.size.toFixed(2)}</td>
                  <td className='py-0.5 text-right text-trade-text-muted'>
                    {level.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className='mb-2 text-xs font-medium uppercase tracking-wide text-trade-red'>
            Asks
          </p>
          <table className='w-full text-xs'>
            <thead>
              <tr className='text-trade-text-muted'>
                <th className='pb-1 text-left font-medium'>Price</th>
                <th className='pb-1 text-right font-medium'>Size</th>
                <th className='pb-1 text-right font-medium'>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderBook.asks.map((level, i) => (
                <tr key={`ask-${i}`} className='text-trade-text'>
                  <td className='py-0.5 text-trade-red'>
                    {formatUsd(level.price)}
                  </td>
                  <td className='py-0.5 text-right'>{level.size.toFixed(2)}</td>
                  <td className='py-0.5 text-right text-trade-text-muted'>
                    {level.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
