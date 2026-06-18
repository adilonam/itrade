import { LandingCryptocurrenciesPage } from '@/components/landing/landing-cryptocurrencies-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingCryptocurrenciesPage appName={appName} session={Boolean(session)} />;
}
