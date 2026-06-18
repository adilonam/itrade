import {
  MANUAL_USDT_DEPOSIT_NETWORKS,
  type ManualUsdtDepositNetworkId
} from '@/constants/data';

export function isManualUsdtDepositNetworkId(
  id: string
): id is ManualUsdtDepositNetworkId {
  return MANUAL_USDT_DEPOSIT_NETWORKS.some((network) => network.id === id);
}

export function getManualUsdtDepositNetwork(id: ManualUsdtDepositNetworkId) {
  const network = MANUAL_USDT_DEPOSIT_NETWORKS.find((n) => n.id === id);
  if (!network) {
    throw new Error(`Unknown manual USDT network: ${id}`);
  }
  return network;
}

/** Manual USDT deposits are credited 1:1 with USD. */
export function usdAmountToManualUsdtAmount(amountUsd: number): number {
  return amountUsd;
}

export function formatManualUsdtPayCurrency(
  networkId: ManualUsdtDepositNetworkId
): string {
  return `usdt-${networkId}`;
}
