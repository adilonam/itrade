import { getTranslations } from 'next-intl/server';
import { landingDisplayFontClassName } from '@/lib/landing-fonts';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';

type LandingCurrenciesPageProps = {
  appName: string;
  session: boolean;
};

export async function LandingCurrenciesPage({ appName, session }: LandingCurrenciesPageProps) {
  const t = await getTranslations('Landing.currenciesPage');
  const currenciesHighlights = [
    {
      title: t('highlights.pairs.title'),
      description: t('highlights.pairs.description')
    },
    {
      title: t('highlights.liquidity.title'),
      description: t('highlights.liquidity.description')
    },
    {
      title: t('highlights.global.title'),
      description: t('highlights.global.description')
    },
    {
      title: t('highlights.flexible.title'),
      description: t('highlights.flexible.description')
    }
  ] as const;

  return (
    <SmxMarketingShell appName={appName} session={session}>

      <section className="pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-7 flex items-center gap-2 text-sm text-gray-500">
            <span>{t('breadcrumb.markets')}</span>
            <span>/</span>
            <span className="text-gray-100">{t('breadcrumb.current')}</span>
          </div>

          <h1 className={`${landingDisplayFontClassName} mb-8 text-[44px] leading-[1.1] text-white md:text-[64px]`}>
            {t('title')}
          </h1>

          <div className="max-w-[860px] space-y-6 text-[17px] leading-8 text-gray-300">
            <p className="text-[22px] leading-8 text-white">
              <strong>{t('introHeading')}</strong>
            </p>
            <p>{t('paragraph1')}</p>
            <p>{t('paragraph2')}</p>

            <div className="space-y-5 pt-2">
              {currenciesHighlights.map((item) => (
                <div key={item.title}>
                  <p className="mb-1 text-base font-semibold text-white">• {item.title}</p>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>

            <p className="pt-4 text-center text-[20px] italic">
              {t('tagline')}
            </p>
          </div>
        </div>
      </section>
    </SmxMarketingShell>
  );
}