import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { landingPageLinks } from '@/constants/data';
import {
  LandingHeaderNavMenus,
  LandingHeaderUtilities
} from '@/components/landing/landing-header-nav';
import { LandingSiteFooter } from '@/components/landing/landing-site-footer';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-colbari-display'
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-colbari-body'
});

type ColbariTradingPitfallsPageProps = {
  appName: string;
  session: boolean;
};

const pitfallsEn = [
  'Overusing leverage and increasing exposure beyond risk tolerance.',
  'Entering trades without a clear setup or invalidation level.',
  'Holding losing positions too long while taking profits too early.',
  'Ignoring stop-loss orders and position sizing rules.',
  'Trading based on emotion after a loss or a rapid market move.'
] as const;

const pitfallsAr = [
  'الإفراط في استخدام الرافعة المالية وزيادة التعرض بما يتجاوز تحمل المخاطر.',
  'الدخول في صفقات دون خطة واضحة أو مستوى إبطال محدد.',
  'الاحتفاظ بالصفقات الخاسرة مدة طويلة وجني الأرباح مبكرا جدا.',
  'تجاهل أوامر وقف الخسارة وقواعد تحديد حجم الصفقة.',
  'اتخاذ قرارات تداول عاطفية بعد خسارة أو حركة سوق حادة.'
] as const;

export async function ColbariTradingPitfallsPage({
  appName,
  session
}: ColbariTradingPitfallsPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'مخاطر التداول',
          title: 'مخاطر التداول',
          subtitle: 'تعرّف على الأخطاء قبل أن تصبح مكلفة',
          paragraph1:
            'تقدم أسواق عقود الفروقات فرصا واسعة، لكن كثيرا من المتداولين يتعثرون بسبب أخطاء متكررة أكثر من تعثرهم بسبب السوق نفسه. النجاح في التداول لا يعتمد على المعرفة الفنية فقط، بل يتطلب الانضباط والوعي بالمخاطر والتحكم في اتخاذ القرار. وبدون هذه العناصر، قد يضعف التنفيذ حتى مع وجود تحليل جيد.',
          paragraph2:
            'تشمل الأخطاء الشائعة الاستخدام المتهور للرافعة، ومطاردة الخسائر، والتمسك بالصفقات الضعيفة أملا في التعويض. كما أن تجاهل أدوات الحماية مثل وقف الخسارة قد يحول الخطأ الصغير إلى خسارة كبيرة بسرعة.',
          listTitle: 'إرشادات عملية لإدارة المخاطر',
          pitfalls: pitfallsAr
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Trading Pitfalls',
          title: 'Trading Pitfalls',
          subtitle: 'Recognizing Mistakes Before They Become Costly',
          paragraph1:
            'CFD markets provide a wide range of opportunities, yet many traders find themselves hindered not by the market itself but by recurring mistakes. Success in trading requires more than technical knowledge. It demands discipline, risk awareness, and control over decision-making. Without these elements, even strong market analysis can be undermined by poor execution.',
          paragraph2:
            'Common pitfalls include using leverage carelessly, chasing losses, or holding onto unprofitable trades in hopes of recovery. Ignoring protective tools like stop-loss orders can turn small mistakes into outsized losses and quickly reduce confidence.',
          listTitle: 'Practical Risk Management Guidelines',
          pitfalls: pitfallsEn
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
          <div className="mb-8 flex items-center gap-2 text-sm text-[#6b6e70]">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className="text-[#1a1c1c]">{content.breadcrumbCurrent}</span>
          </div>

          <h1 className="mb-3 text-[44px] leading-[1.1] font-semibold text-[#1a1c1c] md:text-[56px]">
            {content.title}
          </h1>

          <p className="mb-7 text-[20px] font-semibold leading-8 text-[#1f2325]">
            {content.subtitle}
          </p>

          <div className="space-y-6 text-[16px] leading-8 text-[#2f3335]">
            <p>{content.paragraph1}</p>

            <p>{content.paragraph2}</p>

            <div className="space-y-2 pt-1">
              <h2 className="text-[24px] font-semibold leading-8 text-[#1d2022]">
                {content.listTitle}
              </h2>
              <ul className="list-decimal space-y-1 ps-6">
                {content.pitfalls.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}
