import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  IconBrandApple,
  IconBrandGoogle,
  IconBrandMeta,
  IconDroplet,
  IconTrendingUp
} from '@tabler/icons-react';
import { landingSiteLinks } from '@/constants/data';

const marketDefs = [
  {
    key: 'gold',
    href: landingSiteLinks.marketsCommodities,
    visual: (
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-600 text-xs font-black text-black shadow-lg shadow-yellow-500/20">
        GOLD
      </div>
    )
  },
  {
    key: 'oil',
    href: landingSiteLinks.marketsCommodities,
    visual: (
      <div className="flex h-20 w-14 flex-col items-center justify-center rounded-xl border border-gray-600 bg-gradient-to-b from-gray-700 to-gray-900 p-2 text-center">
        <span className="text-[9px] font-bold tracking-widest text-[#D8A84E]">SMX</span>
        <IconDroplet className="mt-1 size-4 text-[#D8A84E]" stroke={1.75} />
      </div>
    )
  },
  {
    key: 'stocks',
    href: landingSiteLinks.marketsStocks,
    visual: (
      <div className="grid grid-cols-2 gap-2 text-gray-300">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
          <IconBrandApple className="size-4" stroke={1.75} />
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
          <IconBrandGoogle className="size-4" stroke={1.75} />
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
          <IconBrandMeta className="size-4" stroke={1.75} />
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
          T
        </div>
      </div>
    )
  },
  {
    key: 'forex',
    href: landingSiteLinks.marketsCurrencies,
    visual: (
      <div className="grid grid-cols-2 gap-2 text-xl">
        <span>🇺🇸</span>
        <span>🇪🇺</span>
        <span>🇬🇧</span>
        <span>🇯🇵</span>
      </div>
    )
  },
  {
    key: 'indices',
    href: landingSiteLinks.marketsIndices,
    visual: (
      <div className="flex size-16 flex-col items-center justify-center rounded-full border border-blue-500/30 bg-blue-950/80 shadow-lg shadow-blue-500/10">
        <span className="text-[10px] font-bold text-cyan-400">NASDAQ</span>
        <IconTrendingUp className="mt-0.5 size-3 text-[#D8A84E]" stroke={2} />
      </div>
    )
  }
] as const;

export async function SmxMarkets() {
  const t = await getTranslations('SmxLanding.markets');

  return (
    <section
      className="bg-[#07090E] py-20"
      data-purpose="tradable-markets"
      id="markets"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-black text-white sm:text-4xl">
            {t('titleBefore')}{' '}
            <span className="smx-gold-gradient-text">{t('titleHighlight')}</span>
          </h2>
          <p className="text-sm text-gray-400 sm:text-base">{t('description')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {marketDefs.map((market) => (
            <Link
              key={market.key}
              href={market.href}
              className="smx-asset-card flex flex-col items-center justify-between rounded-2xl p-5 text-center"
            >
              <div className="flex h-28 items-center justify-center">{market.visual}</div>
              <div className="mt-2">
                <h3 className="text-lg font-bold text-white">{t(`${market.key}.title`)}</h3>
                <p className="mt-0.5 font-mono text-xs font-bold text-[#D8A84E]">
                  {t(`${market.key}.subtitle`)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
