import { getTranslations } from 'next-intl/server';
import {
  IconBolt,
  IconGlobe,
  IconHeadset,
  IconShieldCheck
} from '@tabler/icons-react';

const benefitDefs = [
  { key: 'global', Icon: IconGlobe },
  { key: 'support', Icon: IconHeadset },
  { key: 'security', Icon: IconShieldCheck },
  { key: 'execution', Icon: IconBolt }
] as const;

export async function SmxBenefitsBar() {
  const t = await getTranslations('SmxLanding.benefits');

  return (
    <section
      className="border-y border-white/5 bg-[#0B0F17] py-8"
      data-purpose="features-strip"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {benefitDefs.map(({ key, Icon }) => (
            <div key={key} className="flex flex-col items-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#D8A84E]/10 text-[#D8A84E]">
                <Icon className="size-5" stroke={1.75} />
              </div>
              <h4 className="mb-1 text-base font-bold text-white">{t(`${key}.title`)}</h4>
              <p className="text-xs text-gray-400">{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
