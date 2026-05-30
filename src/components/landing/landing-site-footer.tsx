import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { colbariSiteLinks } from '@/constants/data';
import { getSupportEmail } from '@/lib/app-url';
import { cn } from '@/lib/utils';

type LandingSiteFooterProps = {
  appName: string;
  className?: string;
};

const replaceBrandName = (text: string, appName: string) =>
  text.replaceAll('Colbari', appName).replaceAll('كولباري', appName);

export async function LandingSiteFooter({ appName, className }: LandingSiteFooterProps) {
  const t = await getTranslations('Landing');
  const supportEmail = await getSupportEmail();

  return (
    <footer
      className={cn(
        'mt-auto w-full border-t border-[#c4c7c7]/30 bg-[#F9F9F9] px-5 py-16 md:px-16',
        className
      )}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex flex-wrap gap-8 border-b border-[#c4c7c7]/20 pb-12">
          <Link
            href={colbariSiteLinks.legal}
            className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
          >
            {t('footer.legal')}
          </Link>
          <Link
            href={colbariSiteLinks.aboutUs}
            className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
          >
            {t('footer.aboutUs')}
          </Link>
          <Link
            href={colbariSiteLinks.contactUs}
            className="text-sm text-[#444748] transition-colors hover:text-[#C0A678]"
          >
            {t('footer.contactUs')}
          </Link>
        </div>

        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="inline-flex shrink-0" aria-label={appName}>
            <Image
              src="/images/logo-light.png"
              alt={`${appName} logo`}
              width={160}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <div className="text-sm text-[#444748]">
            <p className="mb-1 font-medium text-black">{t('footer.customerService')}</p>
            <p>+27 21 891 1885</p>
            <p>
              <a href={`mailto:${supportEmail}`} className="transition-colors hover:text-[#C0A678]">
                {supportEmail}
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-4 text-[11px] leading-relaxed text-[#444748]/80">
          <p>
            <strong>{t('footer.companyInfo')}</strong>{' '}
            {replaceBrandName(t('footer.companyInfoBody'), appName)}
          </p>
          <p>{t('footer.valorValueBridge')}</p>
          <p>{t('footer.dunfield')}</p>
          <p>
            <strong>{t('footer.riskWarningLabel')}</strong> {t('footer.riskWarningBody')}
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
            <strong>{t('footer.riskWarningShortLabel')}</strong> - {t('footer.riskWarningShortBody')}
          </p>
        </div>

        <p className="mt-10 text-[10px] tracking-widest text-[#444748] uppercase">
          {t('footer.copyright', { appName: appName.toUpperCase() })}
        </p>
      </div>
    </footer>
  );
}