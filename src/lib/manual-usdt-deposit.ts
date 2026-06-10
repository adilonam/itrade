export function getManualUsdtDepositWalletAddress(): string {
  return process.env.MANUAL_USDT_DEPOSIT_WALLET_ADDRESS?.trim() ?? '';
}
