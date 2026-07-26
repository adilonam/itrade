import {
  MANUAL_BANK_TRANSFER_ACCOUNTS,
  type ManualBankTransferAccountId
} from '@/constants/data';

export function isManualBankTransferAccountId(
  id: string
): id is ManualBankTransferAccountId {
  return MANUAL_BANK_TRANSFER_ACCOUNTS.some((account) => account.id === id);
}

export function getManualBankTransferAccount(id: ManualBankTransferAccountId) {
  const account = MANUAL_BANK_TRANSFER_ACCOUNTS.find((item) => item.id === id);
  if (!account) {
    throw new Error(`Unknown manual bank transfer account: ${id}`);
  }
  return account;
}

export function formatManualBankTransferPayCurrency(
  accountId: ManualBankTransferAccountId
): string {
  return `bank-${accountId}`;
}

export function formatManualBankTransferAdminNotes(
  amountUsd: number,
  accountLabel: string,
  orderId: string
): string {
  return `Bank transfer (${accountLabel}) — $${amountUsd.toFixed(2)} USD. Reference: ${orderId}`;
}
