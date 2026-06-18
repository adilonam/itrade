import { LandingNfpPage } from '@/components/landing/landing-nfp-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingNfpPage appName={appName} session={Boolean(session)} />;
}
