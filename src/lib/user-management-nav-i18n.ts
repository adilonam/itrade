const USER_MANAGEMENT_NAV_KEYS = {
  Dashboard: 'dashboard',
  Deposit: 'deposit',
  Transfer: 'transfer',
  Withdrawal: 'withdrawal',
  Settings: 'settings',
  'KYC verification': 'kyc'
} as const;

export type UserManagementNavMessageKey =
  (typeof USER_MANAGEMENT_NAV_KEYS)[keyof typeof USER_MANAGEMENT_NAV_KEYS];

export function userManagementNavTitleKey(
  title: string
): UserManagementNavMessageKey | null {
  return (
    (USER_MANAGEMENT_NAV_KEYS as Record<string, UserManagementNavMessageKey>)[
      title
    ] ?? null
  );
}
