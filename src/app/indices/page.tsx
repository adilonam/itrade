import { LandingIndicesPage } from '@/components/landing/landing-indices-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingIndicesPage appName={appName} session={Boolean(session)} />;
}