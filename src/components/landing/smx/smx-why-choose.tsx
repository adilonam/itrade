import { getTranslations } from 'next-intl/server';
import {
  IconChartPie,
  IconShieldLock,
  IconStack2,
  IconUsersGroup
} from '@tabler/icons-react';

const reasonDefs = [
  { key: 'specialist', Icon: IconUsersGroup },
  { key: 'trust', Icon: IconShieldLock },
  { key: 'tools', Icon: IconChartPie },
  { key: 'opportunities', Icon: IconStack2 }
] as const;

export async function SmxWhyChoose() {
  const t = await getTranslations('SmxLanding.whyChoose');

  return (
    <section className="bg-[#07090E] py-20" data-purpose="why-choose-us" id="why-us">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-black text-white sm:text-4xl">
            {t('titleBefore')} <span className="smx-gold-gradient-text">SMX</span>
            {t('titleAfter')}
          </h2>
          <p className="text-sm text-gray-400 sm:text-base">{t('description')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reasonDefs.map(({ key, Icon }) => (
            <div
              key={key}
              className="smx-glass-panel flex flex-col items-center rounded-2xl p-6 text-center transition-all hover:border-[#D8A84E]/50"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#D8A84E]/10 text-[#D8A84E]">
                <Icon className="size-7" stroke={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{t(`${key}.title`)}</h3>
              <p className="text-xs leading-relaxed text-gray-400">{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
