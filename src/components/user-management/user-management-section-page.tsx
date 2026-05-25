'use client';

import { useTranslations } from 'next-intl';
import { userManagementNavTitleKey } from '@/lib/user-management-nav-i18n';
import { UserManagementPageHeader } from '@/components/user-management/user-management-page-header';

type UserManagementSectionPageProps = {
  title: string;
};

export function UserManagementSectionPage({ title }: UserManagementSectionPageProps) {
  const tNav = useTranslations('UserManagement.nav');
  const t = useTranslations('UserManagement.section');
  const key = userManagementNavTitleKey(title);
  const displayTitle = key ? tNav(key) : title;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <UserManagementPageHeader title={displayTitle} />
      <div className="p-6 text-sm text-[var(--trade-text-muted)]">{t('comingSoon')}</div>
    </div>
  );
}
