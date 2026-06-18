import { LandingCfdsPage } from '@/components/landing/landing-cfds-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingCfdsPage appName={appName} session={Boolean(session)} />;
}
