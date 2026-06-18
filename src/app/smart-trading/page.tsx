import { LandingSmartTradingPage } from '@/components/landing/landing-smart-trading-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingSmartTradingPage appName={appName} session={Boolean(session)} />;
}
