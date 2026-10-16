import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';

const platformFeatureKeys = [
  'multiDevice',
  'charts',
  'analysis',
  'execution'
] as const;

const candleHeights = [64, 40, 80, 56, 32, 96, 72, 48, 112] as const;
const candleColors = [
  'bg-emerald-500/80',
  'bg-emerald-500/80',
  'bg-emerald-500/80',
  'bg-rose-500/80',
  'bg-rose-500/80',
  'bg-emerald-500 shadow-sm shadow-emerald-500/50',
  'bg-emerald-500/80',
  'bg-rose-500/80',
  'bg-emerald-500'
] as const;

type SmxPlatformProps = {
  discoverHref: string;
};

export async function SmxPlatform({ discoverHref }: SmxPlatformProps) {
  const t = await getTranslations('SmxLanding.platform');

  return (
    <section
      className="border-t border-white/5 bg-gradient-to-b from-[#080B11] to-[#0D121C] py-20"
      data-purpose="platform-features"
      id="platform"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="order-2 space-y-6 text-start lg:order-1 lg:col-span-6">
            <div className="text-sm font-bold tracking-wider text-[#D8A84E]">{t('eyebrow')}</div>
            <h2 className="text-3xl leading-tight font-extrabold text-white sm:text-4xl">
              {t('title')}
            </h2>
            <p className="text-sm leading-relaxed text-gray-300 sm:text-base">{t('description')}</p>
            <div className="space-y-3.5 pt-2">
              {platformFeatureKeys.map((featureKey) => (
                <div key={featureKey} className="flex items-center gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#D8A84E]/20 text-xs text-[#D8A84E]">
                    <IconCheck className="size-3.5" stroke={2.5} />
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {t(`features.${featureKey}`)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Link
                href={discoverHref}
                className="smx-gold-gradient-bg inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-95"
              >
                <span>{t('discover')}</span>
                <IconArrowLeft className="size-4 ltr:rotate-180" stroke={2} />
              </Link>
            </div>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-[#D8A84E]/10 blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0E131E] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-rose-500" />
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold tracking-widest text-white">
                    SMX TERMINAL v4.2
                  </span>
                  <span className="text-[10px] text-emerald-400">{t('live')}</span>
                </div>
                <div className="relative flex h-56 flex-col justify-between overflow-hidden rounded-xl bg-[#090C12] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">XAU / USD</span>
                      <span className="ms-2 font-mono font-bold text-emerald-400">+1.84%</span>
                    </div>
                    <span className="font-mono font-bold text-[#D8A84E]">2,648.50 $</span>
                  </div>
                  <div className="flex h-28 items-end justify-between gap-1.5 pt-4">
                    {candleHeights.map((height, index) => (
                      <div
                        key={`${height}-${index}`}
                        className={`w-2 rounded-sm ${candleColors[index]}`}
                        style={{ height }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs font-bold">
                    <div className="rounded-lg bg-emerald-600/90 py-1.5 text-white shadow-sm">
                      {t('buy')}
                    </div>
                    <div className="rounded-lg bg-rose-600/90 py-1.5 text-white shadow-sm">
                      {t('sell')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
