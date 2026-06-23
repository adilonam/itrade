import { LandingIcHomepage } from '@/components/landing/ic/landing-ic-homepage';

type LandingHomepageProps = {
  appName: string;
  session: boolean;
};

export function LandingHomepage({ appName, session }: LandingHomepageProps) {
  return <LandingIcHomepage appName={appName} session={session} />;
}
