'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Position, Market } from '@prisma/client';

type PositionWithMarket = Position & {
  market: Market | null;
};

interface PortfolioPieChartProps {
  positions: PositionWithMarket[];
  realTimePrices: Map<string, any>;
  loading?: boolean;
}

interface PortfolioData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  symbol: string;
}

// Generate consistent colors for different assets
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7C7C',
  '#8DD1E1',
  '#D084D0',
  '#87D068',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className='bg-background border-border rounded-lg border p-3 shadow-lg'>
        <p className='font-medium'>{data.name}</p>
        <p className='text-muted-foreground text-sm'>Symbol: {data.symbol}</p>
        <p className='text-sm'>
          Value: <span className='font-medium'>${data.value.toFixed(2)}</span>
        </p>
        <p className='text-sm'>
          Percentage:{' '}
          <span className='font-medium'>{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className='mt-4 flex flex-wrap justify-center gap-2'>
      {payload?.map((entry: any, index: number) => (
        <div key={index} className='flex items-center gap-1 text-sm'>
          <div
            className='h-3 w-3 rounded-full'
            style={{ backgroundColor: entry.color }}
          />
          <span className='text-muted-foreground'>
            {entry.value} ({entry.payload.percentage.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export function PortfolioPieChart({
  positions,
  realTimePrices,
  loading = false
}: PortfolioPieChartProps) {
  const [outerRadius, setOuterRadius] = useState(120);

  useEffect(() => {
    const handleResize = () => {
      setOuterRadius(window.innerWidth < 640 ? 80 : 120);
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const portfolioData = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    // Filter only PLACED positions (active holdings)
    const activePositions = positions.filter(
      (position) => position.status === 'PLACED' && position.market
    );

    if (activePositions.length === 0) return [];

    // Group positions by market and calculate total value
    const marketGroups = activePositions.reduce(
      (acc, position) => {
        const marketSymbol = position.market!.symbol;
        const marketName = position.market!.name;

        // Use real-time price if available, otherwise fallback to stored price

        const positionValue = position.requiredMargin || 0;

        if (!acc[marketSymbol]) {
          acc[marketSymbol] = {
            symbol: marketSymbol,
            name: marketName,
            totalValue: 0,
            positions: []
          };
        }

        acc[marketSymbol].totalValue += positionValue;
        acc[marketSymbol].positions.push(position);

        return acc;
      },
      {} as Record<
        string,
        {
          symbol: string;
          name: string;
          totalValue: number;
          positions: PositionWithMarket[];
        }
      >
    );

    // Calculate total portfolio value
    const totalPortfolioValue = Object.values(marketGroups).reduce(
      (sum, group) => sum + group.totalValue,
      0
    );

    if (totalPortfolioValue === 0) return [];

    // Convert to chart data format
    const chartData: PortfolioData[] = Object.values(marketGroups)
      .map((group, index) => ({
        name: group.name,
        symbol: group.symbol,
        value: group.totalValue,
        percentage: (group.totalValue / totalPortfolioValue) * 100,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    return chartData;
  }, [positions, realTimePrices]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
          <CardDescription>
            Your asset allocation by market value
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-[400px] min-w-0 items-center justify-center'>
          <div className='text-muted-foreground'>Loading portfolio data...</div>
        </CardContent>
      </Card>
    );
  }

  if (portfolioData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
          <CardDescription>
            Your asset allocation by market value
          </CardDescription>
        </CardHeader>
        <CardContent className='flex h-[400px] min-w-0 items-center justify-center'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No active positions found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Your portfolio distribution will appear here once you have active
              positions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Distribution</CardTitle>
        <CardDescription>
          Your asset allocation by market value (Total: ${totalValue.toFixed(2)}
          )
        </CardDescription>
      </CardHeader>
      <CardContent className='min-w-0'>
        <div className='h-[300px] min-w-0 sm:h-[400px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={portfolioData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                outerRadius={outerRadius}
                fill='#8884d8'
                dataKey='value'
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
