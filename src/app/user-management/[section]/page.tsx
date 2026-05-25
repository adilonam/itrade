import {
  userManagementNavPrimary,
  userManagementNavSecondary
} from '@/constants/data';
import { UserManagementSectionPage } from '@/components/user-management/user-management-section-page';
import { notFound } from 'next/navigation';

const ALL = [...userManagementNavPrimary, ...userManagementNavSecondary];

const titleBySlug: Record<string, string> = Object.fromEntries(
  ALL.filter((item) => item.url !== '/user-management').map((item) => {
    const slug = item.url.slice('/user-management/'.length);
    return [slug, item.title] as const;
  })
);

type Props = { params: Promise<{ section: string }> };

export default async function UserManagementSectionRoute({ params }: Props) {
  const { section } = await params;
  const title = titleBySlug[section];
  if (!title) notFound();

  return <UserManagementSectionPage title={title} />;
}
