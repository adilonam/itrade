'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import type { PricePredictionChartPoint } from '@/lib/price-prediction/mock-data';
import { formatUsd } from '@/lib/price-prediction/mock-data';

type PriceChartProps = {
  data: PricePredictionChartPoint[];
  priceToBeat: number;
  className?: string;
};

const chartConfig = {
  price: {
    label: 'Price',
    color: 'var(--color-trade-accent-blue)'
  }
};

export function PriceChart({ data, priceToBeat, className }: PriceChartProps) {
  const minPrice = Math.min(...data.map((d) => d.price), priceToBeat);
  const maxPrice = Math.max(...data.map((d) => d.price), priceToBeat);
  const padding = (maxPrice - minPrice) * 0.1 || 1;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id='priceGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='var(--color-trade-accent-blue)' stopOpacity={0.3} />
            <stop offset='100%' stopColor='var(--color-trade-accent-blue)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          className='stroke-trade-border'
        />
        <XAxis
          dataKey='time'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={40}
          className='text-trade-text-muted'
        />
        <YAxis
          domain={[minPrice - padding, maxPrice + padding]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={70}
          tickFormatter={(v: number) =>
            v < 1 ? v.toFixed(4) : v.toLocaleString('en-US', { maximumFractionDigits: 0 })
          }
          className='text-trade-text-muted'
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatUsd(Number(value))}
            />
          }
        />
        <Area
          type='monotone'
          dataKey='price'
          stroke='var(--color-trade-accent-blue)'
          strokeWidth={2}
          fill='url(#priceGradient)'
          dot={false}
          activeDot={{ r: 4, fill: 'var(--color-trade-accent-blue)' }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
