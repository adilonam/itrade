import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { IconMail, IconMessageCircle } from '@tabler/icons-react';
import { landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';
import { LandingSiteFooter } from '@/components/landing/landing-site-footer';
import { getSupportEmail } from '@/lib/app-url';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-landing-display'
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-landing-body'
});

type LandingContactUsPageProps = {
  appName: string;
  session: boolean;
};

export async function LandingContactUsPage({ appName, session }: LandingContactUsPageProps) {
  const locale = await getLocale();
  const supportEmail = await getSupportEmail();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'الحساب',
          breadcrumbCurrent: 'تواصل معنا',
          title: 'تواصل معنا',
          subtitle:
            'نحن هنا لمساعدتك. أرسل استفسارك إلى بريد الدعم وسيقوم فريقنا بالرد عليك في أقرب وقت.',
          ctaLabel: 'راسل الدعم الآن',
          note: 'يفضل تضمين رقم حسابك أو بيانات الطلب لتسريع المتابعة.'
        }
      : {
          breadcrumbParent: 'Account',
          breadcrumbCurrent: 'Contact Us',
          title: 'Contact Us',
          subtitle:
            'We are here to help. Send your questions to our support inbox and our team will get back to you as soon as possible.',
          ctaLabel: 'Email Support',
          note: 'Please include your account number or request details to speed up support.'
        };

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${ebGaramond.variable} ${inter.className} h-dvh overflow-y-auto bg-[#f5f5f5] text-[#1a1c1c] antialiased`}
    >
      <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center border-b border-white/10 bg-[#141414] px-5 md:px-16">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-6 md:gap-8 lg:gap-12">
            <Link href="/" className="inline-flex shrink-0 items-center" aria-label={appName}>
              <Image
                src="/images/logo-light.png"
                alt={`${appName} logo`}
                width={160}
                height={40}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <LandingHeaderNavMenus />
          </div>
          <LandingHeaderUtilities
            session={session}
            signInHref={landingPageLinks.signIn}
            signUpHref={landingPageLinks.signUp}
            tradeHref={tradeHref}
          />
        </div>
      </header>

      <section className="pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-[10px] tracking-wide text-[#8a8d8f]">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className="text-[#26292a]">{content.breadcrumbCurrent}</span>
          </div>

          <h1 className="mb-4 text-[52px] leading-[1.05] font-semibold text-[#222526] md:text-[64px]">
            {content.title}
          </h1>
          <p className="mb-10 max-w-[820px] text-[18px] leading-8 text-[#35393a] md:text-[20px]">
            {content.subtitle}
          </p>

          <article className="rounded-2xl border border-[#d0d2d2] bg-white p-7 shadow-[0_12px_36px_rgba(0,0,0,0.06)] md:p-10">
            <div className="mb-6 flex items-center gap-3 text-[#222526]">
              <div className="grid size-11 place-items-center rounded-full bg-[#ece9de] text-[#8c7646]">
                <IconMessageCircle className="size-5" stroke={1.8} />
              </div>
              <p className="text-[22px] leading-tight font-medium md:text-[28px]">Support</p>
            </div>

            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#b9a57a] bg-[#f3ecdc] px-5 py-2.5 text-[16px] font-medium text-[#4f4122] transition-colors hover:bg-[#e7dcbf]"
            >
              <IconMail className="size-4" stroke={1.8} />
              {content.ctaLabel}: {supportEmail}
            </a>

            <p className="mt-5 text-sm leading-6 text-[#525758]">{content.note}</p>
          </article>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}
