'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

interface TradingViewRoomTradingProps {
  symbol?: string;
  interval?: string;
  style?: string;
  height?: string | number;
  width?: string | number;
}

function TradingViewRoomTradingComponent({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  style = '1',
  width = '100%',
  height = '100%'
}: TradingViewRoomTradingProps) {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) return;

    // Determine theme colors based on resolved theme
    const isDark = resolvedTheme === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const backgroundColor = isDark ? '#0F0F0F' : '#FFFFFF';
    const gridColor = isDark
      ? 'rgba(242, 242, 242, 0.06)'
      : 'rgba(0, 0, 0, 0.06)';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval,
      locale: 'en',
      save_image: true,
      style,
      symbol,
      theme,
      timezone: 'Etc/UTC',
      backgroundColor,
      gridColor,
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true
    });

    // Clear any existing content
    currentContainer.innerHTML = '';

    // Create the widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = 'calc(100% - 32px)';
    widgetContainer.style.width = '100%';

    // Create the copyright section
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = `
      <a href="https://www.tradingview.com/symbols/${symbol}/" target="_blank" rel="noopener noreferrer">
        <span className="blue-text">${symbol} stock chart</span>
      </a>
      <span className="trademark"> by TradingView</span>
    `;

    currentContainer.appendChild(widgetContainer);
    currentContainer.appendChild(copyrightDiv);
    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, interval, style, resolvedTheme]);

  return (
    <div
      className='tradingview-widget-container h-full w-full'
      ref={container}
      style={{ height, width }}
    />
  );
}

export const TradingViewRoomTrading = memo(TradingViewRoomTradingComponent);
