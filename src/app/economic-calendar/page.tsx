import { LandingEconomicCalendarPage } from '@/components/landing/landing-economic-calendar-page';
import { getPublicAppName } from '@/lib/public-app-name';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = getPublicAppName();

  return <LandingEconomicCalendarPage appName={appName} session={Boolean(session)} />;
}
