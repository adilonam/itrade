import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  IconChartLine,
  IconHeadset,
  IconTool,
  IconWorld
} from '@tabler/icons-react';
import { SmxHeroRegisterForm } from '@/components/landing/smx/smx-hero-register-form';
import { landingPageLinks } from '@/constants/data';

const heroBadgeDefs = [
  { key: 'globalNetwork', Icon: IconWorld },
  { key: 'advancedPlatform', Icon: IconChartLine },
  { key: 'proTools', Icon: IconTool },
  { key: 'arabicSupport', Icon: IconHeadset }
] as const;

type SmxHeroProps = {
  session: boolean;
};

export async function SmxHero({ session }: SmxHeroProps) {
  const t = await getTranslations('SmxLanding.hero');

  return (
    <section
      className="relative min-h-[720px] overflow-hidden pt-12 pb-20"
      data-purpose="hero-banner"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/images/hero/hp-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080B11]/55 via-[#080B11]/85 to-[#080B11] rtl:bg-gradient-to-l rtl:from-[#080B11] rtl:via-[#080B11]/85 rtl:to-[#080B11]/55" />
        <div className="absolute -top-40 end-10 size-[550px] rounded-full bg-[#D8A84E]/10 blur-[130px]" />
        <div className="absolute top-1/2 start-0 size-[450px] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1a2233_1px,transparent_1px)] opacity-25 [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="space-y-8 text-start lg:col-span-7">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8A84E]/30 bg-[#D8A84E]/10 px-3.5 py-1.5 text-xs font-semibold text-[#E8BF6C]">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                {t('badge')}
              </div>
              <h1 className="text-4xl leading-[1.25] font-black text-white sm:text-5xl lg:text-6xl">
                {t('titleLine1')} <br />
                {t('titleLine2Prefix')} <span className="smx-gold-gradient-text">SMX</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg font-medium text-gray-300 sm:text-xl">
                {t('tagline')}
              </p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
                {t('description')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
              {heroBadgeDefs.map(({ key, Icon }) => (
                <div
                  key={key}
                  className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-2"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#D8A84E]/10 text-[#D8A84E]">
                    <Icon className="size-4" stroke={1.75} />
                  </div>
                  <span className="text-xs font-semibold text-gray-200">
                    {t(`badges.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            {session ? (
              <div
                id="register"
                className="smx-glass-panel relative rounded-2xl border-t-2 border-t-[#D8A84E] p-6 text-center shadow-2xl sm:p-8"
              >
                <h3 className="mb-2 text-2xl font-bold text-white">{t('welcomeBackTitle')}</h3>
                <p className="mb-6 text-sm text-gray-400">{t('welcomeBackBody')}</p>
                <Link
                  href={landingPageLinks.trade}
                  className="smx-gold-gradient-bg inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-base font-extrabold text-black shadow-lg shadow-[#D8A84E]/25 transition-all hover:brightness-105"
                >
                  {t('enterPlatform')}
                </Link>
              </div>
            ) : (
              <SmxHeroRegisterForm />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
