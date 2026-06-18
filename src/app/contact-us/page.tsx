import { LandingContactUsPage } from '@/components/landing/landing-contact-us-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingContactUsPage appName={appName} session={Boolean(session)} />;
}
