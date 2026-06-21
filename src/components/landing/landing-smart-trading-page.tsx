import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { brandLogoSrc, landingPageLinks } from '@/constants/data';
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

type LandingSmartTradingPageProps = {
  appName: string;
  session: boolean;
};

const smartTradingSectionsEn = [
  {
    title: 'Establishing Criteria for Trade Selection',
    content:
      "Every trading plan should begin with clear rules for identifying potential opportunities. These criteria may include technical indicators, chart formations, or economic data, depending on the trader's style. Defining selection rules in advance prevents reliance on guesswork and ensures that each position is opened for a valid reason."
  },
  {
    title: 'Balancing Exposure and Capital Protection',
    content:
      'Protecting capital is central to long-term success. A robust plan incorporates methods for determining how much to allocate per trade, as well as acceptable levels of risk. Evaluating each setup through a risk-to-reward lens ensures that potential losses are proportionate to expected gains.'
  },
  {
    title: 'Defining Progress and Reviewing Performance',
    content:
      'No plan is complete without clear goals and regular evaluation. Effective objectives are specific, measurable, and realistic, such as improving trade execution, reducing drawdowns, or achieving a defined return target. Reviewing results at regular intervals allows traders to adjust methods as conditions evolve and keep the strategy dynamic.'
  }
] as const;

const smartTradingSectionsAr = [
  {
    title: 'وضع معايير واضحة لاختيار الصفقات',
    content:
      'تبدأ أي خطة تداول فعالة بقواعد واضحة لتحديد الفرص المحتملة. وقد تشمل هذه القواعد المؤشرات الفنية أو النماذج السعرية أو البيانات الاقتصادية حسب أسلوب المتداول. تحديد هذه المعايير مسبقا يقلل القرارات العشوائية ويجعل فتح كل صفقة مبنيا على سبب موضوعي.'
  },
  {
    title: 'موازنة التعرض مع حماية رأس المال',
    content:
      'حماية رأس المال أساس الاستمرارية على المدى الطويل. لذلك يجب أن تتضمن الخطة آلية واضحة لتحديد حجم الصفقة ونسبة المخاطرة المقبولة. تقييم كل فرصة وفق معادلة العائد مقابل المخاطرة يساعد على بقاء الخسائر ضمن حدود يمكن التحكم بها.'
  },
  {
    title: 'تحديد التقدم ومراجعة الأداء',
    content:
      'لا تكتمل أي خطة دون أهداف واضحة ومراجعة منتظمة. الأهداف الفعالة تكون محددة وقابلة للقياس وواقعية، مثل تحسين جودة التنفيذ أو تقليل التراجعات أو تحقيق عائد مستهدف. المراجعة الدورية للنتائج تمكّن المتداول من تعديل أسلوبه مع تغير ظروف السوق.'
  }
] as const;

export async function LandingSmartTradingPage({
  appName,
  session
}: LandingSmartTradingPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'التداول الذكي',
          title: 'التداول الذكي',
          subtitle: 'بناء إطار تداول مستدام',
          intro:
            'خطة التداول ليست مجرد مجموعة تعليمات، بل هي أساس الاتساق في السوق. من دون هيكل واضح، يميل المتداول إلى قرارات اندفاعية تحكمها العاطفة قصيرة الأجل بدل الأهداف طويلة الأجل. وعند بناء إطار شامل، يصبح اتخاذ القرار أكثر وضوحا، ويتحسن التنفيذ مع تقليل أثر عدم اليقين.',
          sections: smartTradingSectionsAr
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Smart Trading',
          title: 'Smart Trading',
          subtitle: 'Crafting a Sustainable Trading Framework',
          intro:
            'A trading plan is more than a set of guidelines. It is the foundation of consistency in the markets. Without structure, traders often drift toward impulsive actions guided by short-term emotions rather than long-term objectives. By taking the time to establish a comprehensive framework, traders can approach each decision with clarity, improve execution while reducing the influence of uncertainty, and align daily activity with broader financial goals.',
          sections: smartTradingSectionsEn
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
          <div className='mb-8 flex items-center gap-2 text-sm text-[#6b6e70]'>
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className='text-[#1a1c1c]'>{content.breadcrumbCurrent}</span>
          </div>

          <h1 className='mb-3 text-[44px] leading-[1.1] font-semibold text-[#1a1c1c] md:text-[56px]'>
            {content.title}
          </h1>

          <p className='mb-7 text-[20px] leading-8 font-semibold text-[#1f2325]'>
            {content.subtitle}
          </p>

          <div className='space-y-6 text-[16px] leading-8 text-[#2f3335]'>
            <p>{content.intro}</p>

            {content.sections.map((section) => (
              <div key={section.title} className='space-y-2 pt-1'>
                <h2 className='text-[24px] leading-8 font-semibold text-[#1d2022]'>
                  {section.title}
                </h2>
                <p>{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className='bg-[#f5f5f5]' />
    </main>
  );
}
