import { LandingTradingPitfallsPage } from '@/components/landing/landing-trading-pitfalls-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingTradingPitfallsPage appName={appName} session={Boolean(session)} />;
}
