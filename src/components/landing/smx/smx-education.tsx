import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { IconBook, IconBolt, IconPlayerPlay } from '@tabler/icons-react';
import { landingSiteLinks } from '@/constants/data';

const educationCardDefs = [
  {
    key: 'forexIntro',
    href: landingSiteLinks.marketsCurrencies,
    Icon: IconPlayerPlay
  },
  {
    key: 'dailyAnalysis',
    href: landingSiteLinks.learningMarketMovers,
    Icon: IconBook
  },
  {
    key: 'strategies',
    href: landingSiteLinks.learningSmartTrading,
    Icon: IconBolt
  }
] as const;

export async function SmxEducation() {
  const t = await getTranslations('SmxLanding.education');

  return (
    <section
      className="bg-[#07090E] py-20"
      data-purpose="education-resources"
      id="education"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-4 text-start lg:col-span-4">
            <span className="text-xs font-bold tracking-widest text-[#D8A84E] uppercase">
              {t('eyebrow')}
            </span>
            <h2 className="text-3xl leading-tight font-extrabold text-white">{t('title')}</h2>
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">{t('description')}</p>
            <div className="pt-2">
              <Link
                href={landingSiteLinks.education}
                className="smx-gold-gradient-bg inline-block rounded-full px-6 py-3 text-xs font-bold text-black transition-all hover:brightness-110"
              >
                {t('hub')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
            {educationCardDefs.map(({ key, href, Icon }) => (
              <Link
                key={key}
                href={href}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101522] transition-all hover:border-[#D8A84E]/40"
              >
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gray-800">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(216,168,78,0.25),transparent_55%)]" />
                  <div className="z-20 flex size-10 items-center justify-center rounded-full bg-[#D8A84E]/90 text-black shadow-lg transition-transform group-hover:scale-110">
                    <Icon className="size-3.5" stroke={2} />
                  </div>
                </div>
                <div className="p-4 text-start">
                  <h4 className="mb-2 text-xs font-bold text-white">
                    {t(`cards.${key}.title`)}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#D8A84E] group-hover:underline">
                    {t(`cards.${key}.cta`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
