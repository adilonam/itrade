import { getTranslations } from 'next-intl/server';
import { landingDisplayFontClassName } from '@/lib/landing-fonts';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';

type LandingCfdsPageProps = {
  appName: string;
  session: boolean;
};

export async function LandingCfdsPage({ appName, session }: LandingCfdsPageProps) {
  const t = await getTranslations('Landing.cfdsPage');

  return (
    <SmxMarketingShell appName={appName} session={session}>

      <section className="pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-7 flex items-center gap-2 text-sm text-gray-500">
            <span>{t('breadcrumb.learning')}</span>
            <span>/</span>
            <span className="text-gray-100">{t('breadcrumb.current')}</span>
          </div>

          <h1 className={`${landingDisplayFontClassName} mb-8 text-[52px] leading-[1.05] text-white md:text-[64px]`}>
            {t('title')}
          </h1>

          <div className="max-w-[980px] space-y-6 text-[17px] leading-9 text-gray-300">
            <p className="text-[32px] leading-tight text-white md:text-[36px]">
              <strong>{t('introHeading')}</strong>
            </p>

            <p>{t('paragraph1')}</p>
            <p>{t('paragraph2')}</p>

            <ul className="list-disc space-y-2 ps-8 text-[17px] leading-8 text-gray-200">
              <li>{t('bullets.one')}</li>
              <li>{t('bullets.two')}</li>
              <li>{t('bullets.three')}</li>
              <li>{t('bullets.four')}</li>
            </ul>
          </div>
        </div>
      </section>
    </SmxMarketingShell>
  );
}
