export type PriceFeedConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/** REST prices are considered fresh for 3× the fallback poll interval (30s). */
export const REST_PRICE_FRESH_MS = 90_000;

export interface PriceFeedStatusInput {
  hasApiKey: boolean;
  isWsConnected: boolean;
  isWsConnecting: boolean;
  restOnlyMode: boolean;
  lastRestFetchAt: number | null;
  restFetchFailed: boolean;
  hasDesiredSymbols: boolean;
}

export function getPriceFeedConnectionStatus(
  input: PriceFeedStatusInput
): PriceFeedConnectionStatus {
  const {
    hasApiKey,
    isWsConnected,
    isWsConnecting,
    restOnlyMode,
    lastRestFetchAt,
    restFetchFailed,
    hasDesiredSymbols
  } = input;

  if (!hasApiKey) {
    return 'disconnected';
  }

  const restRecentlySucceeded =
    lastRestFetchAt !== null &&
    Date.now() - lastRestFetchAt < REST_PRICE_FRESH_MS;
  // REST-only session: connected unless the latest fetch explicitly failed.
  const restOnlyPending = restOnlyMode && !restFetchFailed;
  const isRestActive = restRecentlySucceeded || restOnlyPending;

  if (isWsConnected || isRestActive) {
    return 'connected';
  }

  if (isWsConnecting && !isRestActive) {
    return 'connecting';
  }

  if (!hasDesiredSymbols) {
    return 'disconnected';
  }

  if (!restFetchFailed && !isWsConnecting) {
    return 'connecting';
  }

  return 'disconnected';
}
