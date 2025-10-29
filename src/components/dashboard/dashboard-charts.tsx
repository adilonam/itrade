'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Pie,
  PieChart,
  Cell
} from 'recharts';

interface Position {
  id: string;
  type: string;
  status: string;
  room: string;
  quantity: number;
  pnl: number | null;
  market: {
    symbol: string;
    name: string;
    type: string;
  } | null;
}

interface UserInvestment {
  id: string;
  amount: number;
  status: string;
  expectedReturn: number;
}

interface DashboardChartsProps {
  positions: {
    trading: Position[];
    stock: Position[];
  };
  investments: UserInvestment[];
  financial: {
    balance: number;
    equity: number;
    usedMargin: number;
    freeMargin: number;
  };
}

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'
];

export function DashboardCharts({
  positions,
  investments,
  financial
}: DashboardChartsProps) {
  // Prepare data for positions by type
  const tradingPositions = positions.trading.filter(
    (p) => p.status === 'PLACED'
  );
  const stockPositions = positions.stock.filter((p) => p.status === 'PLACED');

  // Group positions by market type
  const positionsByType = {
    'Trading FOREX': tradingPositions.filter((p) => p.market?.type === 'FOREX')
      .length,
    'Trading CRYPTO': tradingPositions.filter(
      (p) => p.market?.type === 'CRYPTO'
    ).length,
    'Trading STOCKS': tradingPositions.filter(
      (p) => p.market?.type === 'STOCKS'
    ).length,
    'Trading COMMODITIES': tradingPositions.filter(
      (p) => p.market?.type === 'COMMODITIES'
    ).length,
    'Trading INDICES': tradingPositions.filter(
      (p) => p.market?.type === 'INDICES'
    ).length,
    'Stock Room': stockPositions.length
  };

  const positionTypeData = Object.entries(positionsByType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: type,
      value: count
    }));

  // Prepare P&L comparison data
  const tradingPnL = tradingPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const stockPnL = stockPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const expectedReturns = activeInvestments.reduce(
    (sum, i) => sum + i.expectedReturn,
    0
  );

  const pnlData = [
    {
      name: 'Trading Room',
      value: Number(tradingPnL.toFixed(2))
    },
    {
      name: 'Stock Room',
      value: Number(stockPnL.toFixed(2))
    },
    {
      name: 'Investments (Expected)',
      value: Number(expectedReturns.toFixed(2))
    }
  ];

  // Prepare portfolio distribution data
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const portfolioData = [
    {
      name: 'Free Margin',
      value: Number(financial.freeMargin.toFixed(2))
    },
    {
      name: 'Used Margin',
      value: Number(financial.usedMargin.toFixed(2))
    },
    {
      name: 'Investments',
      value: Number(totalInvested.toFixed(2))
    }
  ].filter((item) => item.value > 0);

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {/* P&L Comparison Chart */}
      <Card className='col-span-2 lg:col-span-1'>
        <CardHeader>
          <CardTitle>P&L Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={pnlData}>
              <XAxis
                dataKey='name'
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey='value' fill='#10b981' radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Portfolio Distribution */}
      <Card className='col-span-2 lg:col-span-1'>
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={portfolioData}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                {portfolioData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(value),
                  'Amount'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Position Type Distribution */}
      {positionTypeData.length > 0 && (
        <Card className='col-span-2'>
          <CardHeader>
            <CardTitle>Positions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={positionTypeData} layout='vertical'>
                <XAxis type='number' />
                <YAxis
                  dataKey='name'
                  type='category'
                  width={150}
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey='value' fill='#3b82f6' radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
