import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
  IconMail,
  IconMapPin,
  IconPhone
} from '@tabler/icons-react';
import {
  landingSiteLinks,
  smxLandingAnchors,
  smxLandingContact,
  smxLandingNavItems
} from '@/constants/data';
import { SmxBrandLogo } from '@/components/landing/smx/smx-brand-logo';

const socialDefs = [
  { key: 'facebook', href: '#', Icon: IconBrandFacebook },
  { key: 'instagram', href: '#', Icon: IconBrandInstagram },
  { key: 'youtube', href: '#', Icon: IconBrandYoutube },
  { key: 'linkedin', href: '#', Icon: IconBrandLinkedin },
  { key: 'x', href: '#', Icon: IconBrandX }
] as const;

const infoDefs = [
  { key: 'aboutSmx', href: landingSiteLinks.aboutUs },
  { key: 'faqs', href: landingSiteLinks.faqs },
  { key: 'privacy', href: landingSiteLinks.legal },
  { key: 'terms', href: landingSiteLinks.legal },
  { key: 'riskWarningLink', href: landingSiteLinks.legal }
] as const;

export async function SmxFooter() {
  const t = await getTranslations('SmxLanding');
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-white/10 bg-[#05060A] pt-16 pb-12 text-xs text-gray-400"
      data-purpose="site-footer"
      id="contact"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <SmxBrandLogo href="/#top" />
            <p className="max-w-sm text-xs leading-relaxed text-gray-400">{t('footer.about')}</p>
            <div className="flex items-center gap-3 pt-2">
              {socialDefs.map(({ key, href, Icon }) => (
                <a
                  key={key}
                  aria-label={t(`footer.social.${key}`)}
                  href={href}
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:border-[#D8A84E] hover:text-[#D8A84E]"
                >
                  <Icon className="size-3.5" stroke={1.75} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {smxLandingNavItems.map((item) => (
                <li key={item.href}>
                  <a
                    className="transition-colors hover:text-[#D8A84E]"
                    href={item.href === smxLandingAnchors.home ? '/#top' : item.href}
                  >
                    {t(`nav.${item.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">{t('footer.info')}</h4>
            <ul className="space-y-2">
              {infoDefs.map((item) => (
                <li key={item.key}>
                  <Link className="transition-colors hover:text-[#D8A84E]" href={item.href}>
                    {t(`footer.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">{t('footer.contact')}</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2" dir="ltr">
                <IconMail className="size-3.5 text-[#D8A84E]" stroke={1.75} />
                <a
                  href={`mailto:${smxLandingContact.email}`}
                  className="transition-colors hover:text-[#D8A84E]"
                >
                  {smxLandingContact.email}
                </a>
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <IconPhone className="size-3.5 text-[#D8A84E]" stroke={1.75} />
                <a
                  href={smxLandingContact.phoneHref}
                  className="transition-colors hover:text-[#D8A84E]"
                >
                  {smxLandingContact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <IconMapPin className="size-3.5 shrink-0 text-[#D8A84E]" stroke={1.75} />
                <span>{t('footer.address')}</span>
              </li>
              <li>
                <Link
                  href={landingSiteLinks.contactUs}
                  className="transition-colors hover:text-[#D8A84E]"
                >
                  {t('footer.contactPage')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4 pt-8 text-center">
          <p className="mx-auto max-w-5xl text-[11px] leading-relaxed text-gray-500">
            {t('footer.riskWarning')}
          </p>
          <p className="text-[11px] text-gray-600">{t('footer.copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
