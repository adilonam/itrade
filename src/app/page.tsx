import { ColbariHomepage } from '@/components/landing/colbari-homepage';
import { getAuthSession } from '@/lib/auth';
import { getSupportEmail } from '@/lib/app-url';

export default async function Page() {
  const session = await getAuthSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'xminvest';
  const supportEmail = await getSupportEmail();

  return (
    <ColbariHomepage appName={appName} session={Boolean(session)} supportEmail={supportEmail} />
  );
}
