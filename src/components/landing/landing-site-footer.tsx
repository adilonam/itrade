import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { brandLogoSrc, landingSiteLinks } from '@/constants/data';
import { getPublicAppName } from '@/lib/public-app-name';
import { cn } from '@/lib/utils';

const LANDING_CUSTOMER_SERVICE_PHONE = '+442039960577';
const LANDING_CUSTOMER_SERVICE_EMAIL = 'support@cfix.markets';

const replaceBrandName = (text: string, appName: string) =>
  text.replaceAll('Colbari', appName).replaceAll('كولباري', appName);

type LandingSiteFooterProps = {
  appName?: string;
  className?: string;
};

export async function LandingSiteFooter({
  appName,
  className
}: LandingSiteFooterProps) {
  const t = await getTranslations('Landing');
  const resolvedAppName = appName ?? getPublicAppName();

  return (
    <footer
      className={cn(
        'mt-auto w-full border-t border-[#c4c7c7]/30 bg-[#F9F9F9] px-5 py-16 md:px-16',
        className
      )}
    >
      <div className='mx-auto max-w-[1440px]'>
        <div className='mb-12 flex flex-wrap gap-8 border-b border-[#c4c7c7]/20 pb-12'>
          <Link
            href={landingSiteLinks.legal}
            className='text-sm text-[#444748] transition-colors hover:text-[#C0A678]'
          >
            {t('footer.legal')}
          </Link>
          <Link
            href={landingSiteLinks.aboutUs}
            className='text-sm text-[#444748] transition-colors hover:text-[#C0A678]'
          >
            {t('footer.aboutUs')}
          </Link>
          <Link
            href={landingSiteLinks.contactUs}
            className='text-sm text-[#444748] transition-colors hover:text-[#C0A678]'
          >
            {t('footer.contactUs')}
          </Link>
        </div>

        <div className='mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between'>
          <Link
            href='/'
            className='inline-flex shrink-0'
            aria-label={resolvedAppName}
          >
            <Image
              src={brandLogoSrc}
              alt={`${resolvedAppName} logo`}
              width={160}
              height={40}
              className='h-8 w-auto'
            />
          </Link>
          <div className='text-sm text-[#444748]'>
            <p className='mb-1 font-medium text-black'>
              {t('footer.customerService')}
            </p>
            <p>{LANDING_CUSTOMER_SERVICE_PHONE}</p>
            <p>
              <a
                href={`mailto:${LANDING_CUSTOMER_SERVICE_EMAIL}`}
                className='transition-colors hover:text-[#C0A678]'
              >
                {LANDING_CUSTOMER_SERVICE_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <div className='space-y-4 text-[11px] leading-relaxed text-[#444748]/80'>
          <p>
            <strong>{t('footer.companyInfo')}</strong>{' '}
            {replaceBrandName(t('footer.companyInfoBody'), resolvedAppName)}
          </p>
          <p>{t('footer.valorValueBridge')}</p>
          <p>{t('footer.dunfield')}</p>
          <p>
            <strong>{t('footer.riskWarningLabel')}</strong>{' '}
            {t('footer.riskWarningBody')}
          </p>
          <p>{t('footer.antiSpam')}</p>
          <p>
            <strong>{t('footer.regionalRestrictionsLabel')}</strong>{' '}
            {t('footer.regionalRestrictionsBody')}
          </p>
          <p>
            <strong>{t('footer.adviserNotice')}</strong>
          </p>
          <p>
            <strong>{t('footer.riskWarningShortLabel')}</strong> -{' '}
            {t('footer.riskWarningShortBody')}
          </p>
        </div>

        <p className='mt-10 text-[10px] tracking-widest text-[#444748] uppercase'>
          {t('footer.copyright', { appName: resolvedAppName.toUpperCase() })}
        </p>
      </div>
    </footer>
  );
}
