'use client';

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  createSeriesMarkers,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp
} from 'lightweight-charts';
const BINARY_TRADE_COLORS = {
  background: '#26261c',
  line: '#e2e8f0',
  grid: 'rgba(226, 232, 240, 0.1)',
  text: '#e2e8f0',
  upColor: '#22c55e',
  downColor: '#ef4444'
};

type CandlestickBar = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Generate initial historical candlestick data (1-min bars). Uses Unix seconds. */
function generateInitialCandles(count: number): CandlestickBar[] {
  const base = 1.084;
  const data: CandlestickBar[] = [];
  // Align to minute boundary: Date.now() is ms, convert to seconds
  const now = Math.floor(Date.now() / 60000) * 60;
  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * 60) as UTCTimestamp;
    const prevClose = data.length ? data[data.length - 1]!.close : base;
    const variation = (Math.random() - 0.5) * 0.0015;
    const close = Math.round((prevClose + variation) * 100000) / 100000;
    const open = prevClose;
    const high = Math.max(open, close) + Math.random() * 0.0003;
    const low = Math.min(open, close) - Math.random() * 0.0003;
    data.push({ time, open, high, low, close });
  }
  return data.sort((a, b) => (a.time as number) - (b.time as number));
}

/** Get next tick price for live stream */
function nextTick(prevClose: number): number {
  const variation = (Math.random() - 0.5) * 0.0008;
  return Math.round((prevClose + variation) * 100000) / 100000;
}

export const EXPIRATION_OPTIONS = [
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 300, label: '5 min' },
  { value: 900, label: '15 min' }
] as const;

interface ChartOrder {
  id: string;
  direction: 'call' | 'put';
  placedAt: number;
  strikePrice: number;
  investment: number;
}

interface BinaryOptionsChartProps {
  expirationSeconds?: number;
  height?: number | string;
  className?: string;
  orders?: ChartOrder[];
  onCurrentPriceChange?: (price: number) => void;
}

export function BinaryOptionsChart({
  expirationSeconds = 60,
  height = '100%',
  className = '',
  orders = [],
  onCurrentPriceChange
}: BinaryOptionsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  interface OrderMarker {
    time: UTCTimestamp;
    position: 'atPriceTop' | 'atPriceBottom' | 'atPriceMiddle';
    price: number;
    shape: 'arrowUp' | 'arrowDown';
    color: string;
    text?: string;
    id?: string;
  }
  const markersPluginRef = useRef<{ setMarkers: (markers: OrderMarker[]) => void } | null>(null);
  const orderPriceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const onCurrentPriceChangeRef = useRef(onCurrentPriceChange);
  onCurrentPriceChangeRef.current = onCurrentPriceChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: BINARY_TRADE_COLORS.background
        },
        textColor: BINARY_TRADE_COLORS.text
      },
      grid: {
        vertLines: { color: BINARY_TRADE_COLORS.grid },
        horzLines: { color: BINARY_TRADE_COLORS.grid }
      },
      rightPriceScale: {
        borderColor: BINARY_TRADE_COLORS.grid,
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: {
        borderColor: BINARY_TRADE_COLORS.grid,
        timeVisible: true,
        secondsVisible: expirationSeconds <= 60
      },
      width: container.clientWidth,
      height:
        typeof height === 'number'
          ? height
          : Math.max(container.clientHeight || 240, 240)
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: BINARY_TRADE_COLORS.upColor,
      downColor: BINARY_TRADE_COLORS.downColor,
      borderVisible: false,
      wickUpColor: BINARY_TRADE_COLORS.upColor,
      wickDownColor: BINARY_TRADE_COLORS.downColor,
      lastValueVisible: false,
      priceLineVisible: false
    });

    const initialData = generateInitialCandles(60);
    series.setData(initialData);

    const lastBarInitial = initialData[initialData.length - 1]!;
    onCurrentPriceChangeRef.current?.(lastBarInitial.close);

    const markersPlugin = createSeriesMarkers(series, []);
    markersPluginRef.current = markersPlugin as { setMarkers: (markers: OrderMarker[]) => void };

    chart.timeScale().fitContent();

    // Live mock stream: update last candle every second, new candle each minute
    let lastBar = initialData[initialData.length - 1]!;
    const streamInterval = setInterval(() => {
      const seriesApi = seriesRef.current;
      if (!seriesApi) return;

      const now = Math.floor(Date.now() / 60000) * 60;
      const currentBarTime = lastBar.time;

      if (now > currentBarTime) {
        // New bar: append new candle
        const open = lastBar.close;
        const close = nextTick(open);
        lastBar = {
          time: now as UTCTimestamp,
          open,
          high: Math.max(open, close),
          low: Math.min(open, close),
          close
        };
        seriesApi.update(lastBar);
      } else {
        // Same bar: update candle with new tick
        const close = nextTick(lastBar.close);
        lastBar = {
          ...lastBar,
          high: Math.max(lastBar.high, close),
          low: Math.min(lastBar.low, close),
          close
        };
        seriesApi.update(lastBar);
      }
      onCurrentPriceChangeRef.current?.(lastBar.close);
    }, 1000);

    const handleResize = () => {
      if (container && chartRef.current) {
        const h =
          typeof height === 'number'
            ? height
            : Math.max(container.clientHeight || 240, 240);
        chartRef.current.applyOptions({ width: container.clientWidth, height: h });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    chartRef.current = chart;
    seriesRef.current = series;

    const priceLinesMap = orderPriceLinesRef.current;
    return () => {
      clearInterval(streamInterval);
      resizeObserver.disconnect();
      priceLinesMap.clear();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersPluginRef.current = null;
    };
  }, [expirationSeconds, height]);

  useEffect(() => {
    const plugin = markersPluginRef.current;
    const series = seriesRef.current;
    if (!plugin || !series) return;

    const markers = orders.map((order) => ({
      time: order.placedAt as UTCTimestamp,
      position: 'atPriceMiddle' as const,
      price: order.strikePrice,
      shape: order.direction === 'call' ? ('arrowUp' as const) : ('arrowDown' as const),
      color: order.direction === 'call' ? BINARY_TRADE_COLORS.upColor : BINARY_TRADE_COLORS.downColor,
      text: `$${order.investment.toFixed(0)}`,
      id: order.id
    }));

    plugin.setMarkers(markers);

    // Sync price lines at strike price for each order
    const currentOrderIds = new Set(orders.map((o) => o.id));
    const priceLines = orderPriceLinesRef.current;

    // Remove price lines for orders no longer in the list
    const toRemove: string[] = [];
    priceLines.forEach((line, orderId) => {
      if (!currentOrderIds.has(orderId)) {
        series.removePriceLine(line);
        toRemove.push(orderId);
      }
    });
    toRemove.forEach((id) => priceLines.delete(id));

    // Add price lines for new orders
    for (const order of orders) {
      if (!priceLines.has(order.id)) {
        const lineColor =
          order.direction === 'call' ? BINARY_TRADE_COLORS.upColor : BINARY_TRADE_COLORS.downColor;
        const priceLine = series.createPriceLine({
          price: order.strikePrice,
          color: lineColor,
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: order.strikePrice.toFixed(5)
        });
        priceLines.set(order.id, priceLine);
      }
    }
  }, [orders]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${className}`.trim()}
      style={
        typeof height === 'number'
          ? { height, width: '100%', minHeight: 200 }
          : { width: '100%', minHeight: 200 }
      }
    />
  );
}
