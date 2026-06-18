import { LandingFaqsTradingPlatformPage } from '@/components/landing/landing-faqs-trading-platform-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingFaqsTradingPlatformPage appName={appName} session={Boolean(session)} />;
}