import { ColbariEconomicCalendarPage } from '@/components/landing/colbari-economic-calendar-page';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'xminvest';

  return <ColbariEconomicCalendarPage appName={appName} session={Boolean(session)} />;
}
