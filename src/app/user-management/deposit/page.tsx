import { UserManagementDepositPage } from '@/components/user-management/user-management-deposit-page';
import { getManualUsdtDepositWalletAddress } from '@/lib/manual-usdt-deposit';

export default async function UserManagementDepositRoutePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  return (
    <UserManagementDepositPage
      paymentReturnStatus={sp.status ?? null}
      manualUsdtWalletAddress={getManualUsdtDepositWalletAddress()}
    />
  );
}
