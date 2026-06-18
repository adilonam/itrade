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
  variable: '--font-landing-display'
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-landing-body'
});

type LandingTechnicalFundamentalPageProps = {
  appName: string;
  session: boolean;
};

const sectionsEn = [
  {
    title: 'Technical Analysis',
    paragraphs: [
      'Effective technical analysis begins by identifying the overall market environment. Recognizing whether a market is trending higher, declining, or consolidating creates the framework for evaluating opportunities. From there, traders can map support and resistance zones that often act as reference points for entries and exits.',
      'To refine this view, traders use indicators such as moving averages, oscillators, and momentum tools. These techniques provide additional context to confirm trends and avoid acting on short-term noise.'
    ]
  },
  {
    title: 'Fundamental Analysis',
    paragraphs: [
      'Fundamental analysis evaluates the broader forces that shape asset valuations. Economic releases, central bank policy statements, corporate earnings, and geopolitical developments all influence sentiment and direction. Understanding these drivers helps traders interpret whether market moves are supported by stronger long-term conditions.',
      'By combining technical and fundamental methods in a structured process, traders can make decisions with greater confidence, manage risk more effectively, and adapt to changing market conditions over time.'
    ]
  }
] as const;

const sectionsAr = [
  {
    title: 'التحليل الفني',
    paragraphs: [
      'يبدأ التحليل الفني الفعال بتحديد السياق العام للسوق: هل الاتجاه صاعد أم هابط أم عرضي. هذا الإطار يساعد على تقييم الفرص بوضوح، ثم تحديد مناطق الدعم والمقاومة التي تشكل نقاطا مرجعية للدخول والخروج.',
      'ولتحسين القراءة، يستخدم المتداولون أدوات مثل المتوسطات المتحركة والمذبذبات ومؤشرات الزخم. هذه الأدوات تضيف طبقة تأكيد للاتجاه وتقلل تأثير الضوضاء السعرية قصيرة المدى.'
    ]
  },
  {
    title: 'التحليل الأساسي',
    paragraphs: [
      'يركز التحليل الأساسي على العوامل الواسعة التي تؤثر في تقييم الأصول، مثل البيانات الاقتصادية وقرارات البنوك المركزية ونتائج الشركات والتطورات الجيوسياسية. فهم هذه المحركات يساعد على تفسير ما إذا كانت حركة السوق مدعومة بعوامل طويلة الأجل.',
      'الجمع بين التحليل الفني والأساسي ضمن منهج منظم يمنح المتداول ثقة أكبر في القرار، ويحسن إدارة المخاطر، ويزيد القدرة على التكيف مع تغير ظروف السوق بمرور الوقت.'
    ]
  }
] as const;

export async function LandingTechnicalFundamentalPage({
  appName,
  session
}: LandingTechnicalFundamentalPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'التحليل الفني والأساسي',
          title: 'التحليل الفني والأساسي',
          subtitle: 'تعزيز استراتيجية تداول عقود الفروقات عبر تحليل السوق',
          intro:
            'تعتمد المقاربة الناجحة للتداول على الجمع بين المنظورين الفني والأساسي. فلكل منهما زاوية مختلفة، لكن دمجهما يقدم فهما أعمق لسلوك السوق ويساعد على اتخاذ قرارات أكثر توازنا في مختلف الظروف.',
          sections: sectionsAr
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Technical And Fundamental',
          title: 'Technical and Fundamental',
          subtitle: 'Strengthening Your CFD Strategy with Market Analysis',
          intro:
            'A successful trading approach combines both technical and fundamental perspectives. While each has its own focus, together they provide a more complete understanding of market behavior and help traders make balanced decisions under different market conditions.',
          sections: sectionsEn
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
            <p>{content.intro}</p>

            {content.sections.map((section) => (
              <div key={section.title} className="space-y-3 pt-1">
                <h2 className="text-[24px] font-semibold leading-8 text-[#1d2022]">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}
