import { LandingTechnicalFundamentalPage } from '@/components/landing/landing-technical-fundamental-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingTechnicalFundamentalPage appName={appName} session={Boolean(session)} />;
}
