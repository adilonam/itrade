import { LandingGlossaryPage } from '@/components/landing/landing-glossary-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingGlossaryPage appName={appName} session={Boolean(session)} />;
}
