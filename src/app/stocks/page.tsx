import { LandingStocksPage } from '@/components/landing/landing-stocks-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingStocksPage appName={appName} session={Boolean(session)} />;
}