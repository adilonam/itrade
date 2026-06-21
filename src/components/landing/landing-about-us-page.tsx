import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import {
  IconClock,
  IconHeadset,
  IconLock,
  IconScale,
  IconShield,
  IconShieldCheck
} from '@tabler/icons-react';
import { brandLogoSrc, landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';
import { LandingSiteFooter } from '@/components/landing/landing-site-footer';
import { withAppName } from '@/lib/public-app-name';

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

type LandingAboutUsPageProps = {
  appName: string;
  session: boolean;
};

const aboutHighlightsEn = [
  {
    title: 'Transparent Oversight',
    description:
      '{appName} operates with a strong commitment to transparency and industry standards. Traders can rely on a secure environment supported by clear regulatory supervision. The brand is operated by VALOR CAPITAL (PTY) LTD, which is authorized and regulated by the Financial Sector Conduct Authority of South Africa with Financial Service Provider (FSP) license number 51822.',
    icon: IconShieldCheck
  },
  {
    title: 'Financial Safeguards',
    description:
      'Client balances are kept in independent accounts, separate from company operations. This structure ensures that personal funds remain fully protected, providing stability no matter how the market moves.',
    icon: IconShield
  },
  {
    title: 'Support When It Matters Most',
    description:
      'Access to experienced support staff, available 24/5, ensures that traders are never left without support. From security concerns to account inquiries, the team at {appName} is ready to assist whenever needed.',
    icon: IconHeadset
  },
  {
    title: 'Protection Through Technology',
    description:
      'Every account at {appName} is secured with advanced systems. From encrypted data transfers to multi-step authentication, the platform is designed with modern protection standards at every layer.',
    icon: IconLock
  },
  {
    title: 'Operational Security',
    description:
      'Funding and withdrawals are handled with care and reliability. With strict monitoring in place, traders can move their capital with confidence, knowing that fraud-prevention measures are working behind the scenes.',
    icon: IconClock
  },
  {
    title: 'Regulation',
    description:
      '{appName} is operated by VALOR CAPITAL (PTY) LTD, a South African investment firm, authorized and regulated by the Financial Sector Conduct Authority of South Africa with Financial Service Provider (FSP) license number 51822.',
    icon: IconScale
  }
] as const;

const aboutHighlightsAr = [
  {
    title: 'رقابة شفافة',
    description:
      'تعمل {appName} وفق التزام واضح بالشفافية ومعايير القطاع. يمكن للمتداولين الاعتماد على بيئة آمنة مدعومة بإشراف تنظيمي واضح. تُدار العلامة بواسطة VALOR CAPITAL (PTY) LTD المرخصة والمنظمة من هيئة سلوك القطاع المالي في جنوب أفريقيا بترخيص مزود خدمات مالية رقم 51822.',
    icon: IconShieldCheck
  },
  {
    title: 'ضمانات مالية',
    description:
      'تُحفظ أرصدة العملاء في حسابات مستقلة ومنفصلة عن عمليات الشركة، ما يعزز حماية الأموال الشخصية ويوفر استقرارا بغض النظر عن حركة السوق.',
    icon: IconShield
  },
  {
    title: 'دعم عندما تحتاجه',
    description:
      'يوفر فريق الدعم المتخصص خدمة متاحة 24/5 لضمان عدم بقاء المتداول دون مساعدة. من الاستفسارات الأمنية إلى أسئلة الحساب، فريق {appName} جاهز للمساعدة.',
    icon: IconHeadset
  },
  {
    title: 'حماية بالتقنية',
    description:
      'يتم تأمين كل حساب عبر أنظمة متقدمة، من تشفير نقل البيانات إلى المصادقة متعددة الخطوات، مع طبقات حماية حديثة على مستوى المنصة بالكامل.',
    icon: IconLock
  },
  {
    title: 'أمان تشغيلي',
    description:
      'تتم عمليات الإيداع والسحب بعناية وموثوقية. ومع وجود مراقبة صارمة، يمكن للمتداول إدارة رأس المال بثقة مع إجراءات منع الاحتيال في الخلفية.',
    icon: IconClock
  },
  {
    title: 'التنظيم',
    description:
      'تُدار {appName} بواسطة VALOR CAPITAL (PTY) LTD، وهي شركة استثمار جنوب أفريقية مرخصة ومنظمة من هيئة سلوك القطاع المالي في جنوب أفريقيا بترخيص مزود خدمات مالية رقم 51822.',
    icon: IconScale
  }
] as const;

export async function LandingAboutUsPage({
  appName,
  session
}: LandingAboutUsPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'الحساب',
          breadcrumbCurrent: 'من نحن',
          title: 'من نحن',
          highlights: aboutHighlightsAr
        }
      : {
          breadcrumbParent: 'Account',
          breadcrumbCurrent: 'About Us',
          title: 'About Us',
          highlights: aboutHighlightsEn
        };

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${ebGaramond.variable} ${inter.className} h-dvh overflow-y-auto bg-[#f5f5f5] text-[#1a1c1c] antialiased`}
    >
      <header className='fixed top-0 left-0 z-50 flex h-20 w-full items-center border-b border-white/10 bg-[#141414] px-5 md:px-16'>
        <div className='mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-6'>
          <div className='flex min-w-0 items-center gap-6 md:gap-8 lg:gap-12'>
            <Link
              href='/'
              className='inline-flex shrink-0 items-center'
              aria-label={appName}
            >
              <Image
                src={brandLogoSrc}
                alt={`${appName} logo`}
                width={160}
                height={40}
                className='h-12 w-auto'
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

      <section className='pt-28 pb-20 md:pt-36 md:pb-24'>
        <div className='mx-auto w-full max-w-[1060px] px-5 md:px-16'>
          <div className='mb-8 flex items-center gap-2 text-[10px] tracking-wide text-[#8a8d8f]'>
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className='text-[#26292a]'>{content.breadcrumbCurrent}</span>
          </div>

          <h1 className='mb-8 text-[56px] leading-[1.05] font-semibold text-[#222526]'>
            {content.title}
          </h1>

          <div className='space-y-6'>
            {content.highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className='flex items-start gap-5'>
                  <div className='grid size-14 shrink-0 place-items-center rounded-full bg-[#e5e6e8] text-[#1f2223]'>
                    <Icon className='size-7' stroke={1.6} />
                  </div>
                  <div className='pt-0.5'>
                    <h2 className='mb-1 text-[30px] leading-tight font-medium text-[#1f2223] md:text-[38px]'>
                      {item.title}
                    </h2>
                    <p className='text-[20px] leading-7 text-[#303336] md:text-[18px]'>
                      {withAppName(item.description, appName)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className='bg-[#f5f5f5]' />
    </main>
  );
}
