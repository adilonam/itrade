# TwelveData WebSocket Test Page

This page provides a comprehensive testing interface for the TwelveData WebSocket API for real-time price streaming.

## Features

- **Connection Management**: Connect/disconnect to the TwelveData WebSocket API
- **Symbol Subscription**: Subscribe to multiple symbols for real-time price updates
- **Live Data Display**: View real-time price data with bid/ask spreads and volume
- **Subscription Management**: Add/remove symbols and view subscription status
- **Error Handling**: Comprehensive error handling and status reporting
- **Heartbeat Support**: Automatic heartbeat to maintain connection stability

## Usage

1. **Get API Key**: Obtain a TwelveData API key from [twelvedata.com](https://twelvedata.com)
2. **Enter API Key**: Input your API key in the connection settings
3. **Connect**: Click the "Connect" button to establish WebSocket connection
4. **Subscribe**: Add symbols (e.g., AAPL, MSFT, EUR/USD, BTC/USD) to receive real-time updates
5. **Monitor**: View live price data in the "Live Data" tab

## Supported Symbols

- **Stocks**: AAPL, MSFT, GOOGL, TSLA, AMZN, etc.
- **Forex**: EUR/USD, GBP/USD, USD/JPY, etc.
- **Crypto**: BTC/USD, ETH/USD, etc.
- **Commodities**: XAU/USD (Gold), XAG/USD (Silver), etc.

## WebSocket API Details

- **Endpoint**: `wss://ws.twelvedata.com/v1/quotes/price?apikey=your_api_key`
- **Credits**: 1 WebSocket credit per symbol (API credits not used)
- **Heartbeat**: Recommended every 10 seconds to maintain connection
- **Reconnection**: Automatic reconnection with exponential backoff

## Features Implemented

- ✅ Connection management with status indicators
- ✅ Symbol subscription/unsubscription
- ✅ Real-time price data display
- ✅ Bid/ask spread information
- ✅ Volume data
- ✅ Error handling and status reporting
- ✅ Automatic heartbeat
- ✅ Connection recovery
- ✅ Local API key storage
- ✅ Responsive UI with tabs
- ✅ Popular symbol quick actions

## Technical Implementation

- **Custom Hook**: `useTwelveDataWebSocket` for WebSocket management
- **TypeScript**: Full type safety with comprehensive interfaces
- **React**: Modern functional components with hooks
- **Tailwind CSS**: Responsive styling with shadcn/ui components
- **Tabler Icons**: Consistent iconography throughout the interface
