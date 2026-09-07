import { getTranslations } from 'next-intl/server';

const statDefs = [
  { value: '+100K', labelKey: 'traders' },
  { value: '+1,000', labelKey: 'instruments' },
  { value: '5/5', labelKey: 'rating' },
  { value: '24/7', labelKey: 'support' }
] as const;

export async function SmxStats() {
  const t = await getTranslations('SmxLanding.stats');

  return (
    <section
      className="border-y border-white/5 bg-[#0A0D15] py-16"
      data-purpose="statistics"
    >
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="mb-1 text-2xl font-bold text-white sm:text-3xl">{t('title')}</h2>
          <p className="text-xs text-gray-400 sm:text-sm">{t('description')}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {statDefs.map((stat) => (
            <div key={stat.labelKey}>
              <div className="mb-2 font-mono text-4xl font-black text-[#D8A84E] sm:text-5xl">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-gray-300 sm:text-sm">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
