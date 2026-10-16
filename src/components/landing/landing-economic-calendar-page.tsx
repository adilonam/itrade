import { landingDisplayFontClassName } from '@/lib/landing-fonts';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';

type LandingEconomicCalendarPageProps = {
  appName: string;
  session: boolean;
};

export async function LandingEconomicCalendarPage({
  appName,
  session
}: LandingEconomicCalendarPageProps) {

  return (
    <SmxMarketingShell appName={appName} session={session}>

      <section className="pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-16">
          <div className="mb-7 flex items-center gap-2 text-sm text-gray-500">
            <span>Learning</span>
            <span>/</span>
            <span className="text-gray-100">Economic Calendar</span>
          </div>

          <h1 className={`${landingDisplayFontClassName} mb-8 text-[44px] leading-[1.1] text-white md:text-[64px]`}>
            Economic Calendar
          </h1>

          <div className="overflow-hidden border border-white/15 bg-transparent">
            <iframe
              src="https://www.tradays.com/en/economic-calendar/widget?mode=2"
              title="Economic Calendar"
              loading="lazy"
              className="h-[640px] w-full bg-white/5 md:h-[760px]"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </SmxMarketingShell>
  );
}
