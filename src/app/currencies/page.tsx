import { LandingCurrenciesPage } from '@/components/landing/landing-currencies-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingCurrenciesPage appName={appName} session={Boolean(session)} />;
}