import { LandingHomepage } from '@/components/landing/landing-homepage';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingHomepage appName={appName} session={Boolean(session)} />;
}
