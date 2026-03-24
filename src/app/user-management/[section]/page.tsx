import {
  userManagementNavPrimary,
  userManagementNavSecondary
} from '@/constants/data';
import { notFound } from 'next/navigation';

const ALL = [...userManagementNavPrimary, ...userManagementNavSecondary];

const titleBySlug: Record<string, string> = Object.fromEntries(
  ALL
    .filter((item) => item.url !== '/user-management')
    .map((item) => {
      const slug = item.url.slice('/user-management/'.length);
      return [slug, item.title] as const;
    })
);

type Props = { params: Promise<{ section: string }> };

export default async function UserManagementSectionPage({ params }: Props) {
  const { section } = await params;
  const title = titleBySlug[section];
  if (!title) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          {title}
        </h1>
      </header>
      <div className="p-6 text-sm text-[var(--trade-text-muted)]">
        Content coming soon.
      </div>
    </div>
  );
}
