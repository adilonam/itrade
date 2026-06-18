import { LandingMarketMoversPage } from '@/components/landing/landing-market-movers-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingMarketMoversPage appName={appName} session={Boolean(session)} />;
}
