import { landingPageLinks } from '@/constants/data';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';
import { SmxHero } from '@/components/landing/smx/smx-hero';
import { SmxBenefitsBar } from '@/components/landing/smx/smx-benefits-bar';
import { SmxMarkets } from '@/components/landing/smx/smx-markets';
import { SmxPlatform } from '@/components/landing/smx/smx-platform';
import { SmxWhyChoose } from '@/components/landing/smx/smx-why-choose';
import { SmxStats } from '@/components/landing/smx/smx-stats';
import { SmxEducation } from '@/components/landing/smx/smx-education';
import { SmxFinalCta } from '@/components/landing/smx/smx-final-cta';

type LandingHomepageProps = {
  appName: string;
  session: boolean;
};

export async function LandingHomepage({ appName, session }: LandingHomepageProps) {
  const openAccountHref = session ? landingPageLinks.trade : landingPageLinks.signUp;
  const discoverHref = session ? landingPageLinks.trade : landingPageLinks.signUp;

  return (
    <SmxMarketingShell appName={appName} session={session} id="top">
      <SmxHero session={session} />
      <SmxBenefitsBar />
      <SmxMarkets />
      <SmxPlatform discoverHref={discoverHref} />
      <SmxWhyChoose />
      <SmxStats />
      <SmxEducation />
      <SmxFinalCta registerHref={openAccountHref} />
    </SmxMarketingShell>
  );
}
