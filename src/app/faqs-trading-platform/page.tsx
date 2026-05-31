import { ColbariFaqsTradingPlatformPage } from '@/components/landing/colbari-faqs-trading-platform-page';
import { getAuthSession } from '@/lib/auth';

export default async function Page() {
  const session = await getAuthSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'xminvest';

  return <ColbariFaqsTradingPlatformPage appName={appName} session={Boolean(session)} />;
}