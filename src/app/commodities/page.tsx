import { LandingCommoditiesPage } from '@/components/landing/landing-commodities-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingCommoditiesPage appName={appName} session={Boolean(session)} />;
}