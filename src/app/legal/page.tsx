import { LandingLegalPage } from '@/components/landing/landing-legal-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingLegalPage appName={appName} session={Boolean(session)} />;
}