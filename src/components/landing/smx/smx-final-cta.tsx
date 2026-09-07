import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { IconArrowLeft } from '@tabler/icons-react';

type SmxFinalCtaProps = {
  registerHref: string;
};

export async function SmxFinalCta({ registerHref }: SmxFinalCtaProps) {
  const t = await getTranslations('SmxLanding.finalCta');

  return (
    <section className="bg-[#07090E] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="smx-gold-gradient-bg flex flex-col items-center justify-between gap-6 rounded-3xl p-8 text-black shadow-2xl sm:p-10 md:flex-row">
          <div>
            <h2 className="mb-1 text-2xl font-black sm:text-3xl">{t('title')}</h2>
            <p className="text-xs font-medium text-black/80 sm:text-sm">{t('description')}</p>
          </div>
          <Link
            href={registerHref}
            className="flex shrink-0 items-center gap-3 rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:bg-black/90 active:scale-95"
          >
            <span>{t('register')}</span>
            <IconArrowLeft className="size-4 ltr:rotate-180" stroke={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
