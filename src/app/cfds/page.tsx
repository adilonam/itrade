import { ColbariCfdsPage } from '@/components/landing/colbari-cfds-page';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'xminvest';

  return <ColbariCfdsPage appName={appName} session={Boolean(session)} />;
}
