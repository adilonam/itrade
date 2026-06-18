import { LandingAboutUsPage } from '@/components/landing/landing-about-us-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingAboutUsPage appName={appName} session={Boolean(session)} />;
}