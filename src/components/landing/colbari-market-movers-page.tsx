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

type ColbariMarketMoversPageProps = {
  appName: string;
  session: boolean;
};

const marketMoverSectionsEn = [
  {
    title: 'Market Hours',
    paragraphs: [
      'Global financial markets operate continuously, but activity levels rise and fall with regional trading sessions. London and New York are home to the most liquid hours, particularly when their sessions overlap, while Asia-Pacific activity during Tokyo and Sydney sets the tone for JPY, AUD, and NZD pairs.',
      'Different asset classes also react distinctly to timing. Forex pairs tied to USD, EUR, and GBP often move most during London and New York, while commodities such as oil and gold can spike when U.S. economic reports are released. Recognizing these session dynamics allows traders to align strategies with the times of day when volatility and liquidity are most favorable.'
    ]
  },
  {
    title: 'Interest Rates',
    paragraphs: [
      'A rate increase can strengthen a currency but weigh on equities and bonds. Lower rates often encourage risk-taking and support growth but may weaken exchange rates. Beyond the numbers themselves, forward guidance and tone matter greatly. Unexpected signals can shift sentiment instantly across asset classes. Traders who follow these announcements closely are better positioned to anticipate volatility.'
    ]
  },
  {
    title: 'Inflation',
    paragraphs: [
      'Inflation reflects the pace of rising prices and purchasing power. Reports such as CPI and PPI give traders a window into economic health and central bank decision-making. Persistently high inflation often forces tighter monetary policy, while subdued inflation can encourage growth but may also reveal weak demand.',
      'The implications extend beyond interest rates. Inflation affects consumer behavior, corporate earnings, and bond yields, rippling across markets in different ways. For traders, spotting inflation trends early provides a competitive edge in preparing for policy moves and market sentiment shifts.'
    ]
  },
  {
    title: 'NFP',
    paragraphs: [
      'The U.S. Non-Farm Payrolls report (NFP) is released monthly and remains one of the most influential drivers of volatility. As a key indicator of economic strength, NFP tracks job creation, unemployment, and wage growth across industries. Strong employment numbers usually boost the U.S. dollar and equities, while weak results can trigger risk aversion and speculation about looser monetary policy.',
      'The headline number matters, but details such as labor participation and sector breakdowns also shape interpretation. Because of its significance to both policymakers and investors, NFP often produces immediate, sharp reactions in forex and equity markets.'
    ]
  },
  {
    title: 'GDP Reports',
    paragraphs: [
      "GDP serves as the broadest measure of a nation's economic output, covering consumption, investment, government spending, and trade. A strong GDP release can strengthen currencies and equities by signaling confidence in growth. Weaker figures often lead to caution, pushing investors toward safer assets.",
      'Traders examine GDP beyond the top-line number. Shifts in exports, business investment, and consumer demand can reveal longer-term trends that affect multiple markets. For this reason, GDP remains one of the most closely watched indicators for assessing economic momentum.'
    ]
  },
  {
    title: 'Geopolitical Risks',
    paragraphs: [
      'Financial markets often react sharply to geopolitical events. Trade disputes, elections, sanctions, and military conflicts disrupt expectations and create waves of uncertainty. History shows examples such as Brexit negotiations, U.S.-China trade tensions, and OPEC oil production decisions driving sudden volatility across currencies, commodities, and equities.',
      'In these periods, safe-haven assets like gold, the U.S. dollar, or government bonds tend to attract inflows, while risk-sensitive assets experience outflows. Traders who track geopolitical developments closely are better prepared to adapt to these abrupt changes, protecting their positions or capitalizing on short-term opportunities.'
    ]
  }
] as const;

const marketMoverTopicsAr = [
  'ساعات السوق',
  'أسعار الفائدة',
  'التضخم',
  'NFP',
  'تقارير الناتج المحلي',
  'المخاطر الجيوسياسية'
] as const;

const marketMoverSectionsAr = [
  {
    title: 'ساعات السوق',
    paragraphs: [
      'تعمل الأسواق المالية العالمية بشكل متواصل، لكن مستويات النشاط ترتفع وتنخفض مع جلسات التداول الإقليمية. وتعد ساعات لندن ونيويورك الأكثر سيولة، خصوصا عند تداخل الجلستين، بينما تحدد جلسات طوكيو وسيدني نبرة تداول أزواج الين والدولارين الأسترالي والنيوزيلندي.',
      'كما تتفاعل فئات الأصول بشكل مختلف مع التوقيت. فأزواج العملات المرتبطة بالدولار الأمريكي واليورو والجنيه الإسترليني تتحرك غالبا بقوة خلال لندن ونيويورك، بينما قد ترتفع تقلبات الذهب والنفط عند صدور بيانات اقتصادية أمريكية. فهم هذه الديناميكيات يساعد المتداول على مواءمة استراتيجيته مع أفضل فترات السيولة والتقلب.'
    ]
  },
  {
    title: 'أسعار الفائدة',
    paragraphs: [
      'قد يؤدي رفع الفائدة إلى دعم العملة مع الضغط على الأسهم والسندات. أما خفض الفائدة فيشجع غالبا شهية المخاطر والنمو، لكنه قد يضعف سعر الصرف. ولا يقتصر التأثير على الرقم نفسه، فالتوجيه المستقبلي ونبرة البنوك المركزية قد يغيران معنويات السوق بسرعة عبر عدة أصول.'
    ]
  },
  {
    title: 'التضخم',
    paragraphs: [
      'يعكس التضخم وتيرة ارتفاع الأسعار وقوة الشراء. وتمنح تقارير مثل CPI وPPI المتداولين قراءة مبكرة عن صحة الاقتصاد وتوجهات السياسة النقدية. التضخم المرتفع لفترة طويلة قد يدفع نحو تشديد السياسة، بينما التضخم المنخفض قد يدعم النمو لكنه قد يشير أيضا إلى ضعف الطلب.',
      'يمتد تأثير التضخم إلى ما بعد أسعار الفائدة، إذ ينعكس على سلوك المستهلك وأرباح الشركات وعوائد السندات. لذلك فإن تتبع اتجاهات التضخم مبكرا يمنح المتداول أفضلية في الاستعداد لتحولات السياسة ومعنويات السوق.'
    ]
  },
  {
    title: 'NFP',
    paragraphs: [
      'يصدر تقرير الوظائف غير الزراعية الأمريكي شهريا ويعد من أقوى المحركات للتقلب. وباعتباره مؤشرا رئيسيا لقوة الاقتصاد، يتابع التقرير التوظيف والبطالة ونمو الأجور عبر القطاعات. النتائج القوية تدعم الدولار والأسهم غالبا، بينما النتائج الضعيفة قد تزيد العزوف عن المخاطر وتدعم توقعات التيسير النقدي.',
      'لا يقتصر التحليل على الرقم الرئيسي فقط، بل تشمل القراءة معدل المشاركة وتوزيع الوظائف حسب القطاعات. وبسبب أهميته لصناع القرار والمستثمرين، كثيرا ما يسبب التقرير تحركات حادة وفورية في أسواق العملات والأسهم.'
    ]
  },
  {
    title: 'تقارير الناتج المحلي',
    paragraphs: [
      'يمثل الناتج المحلي الإجمالي أوسع مقياس للنشاط الاقتصادي، إذ يشمل الاستهلاك والاستثمار والإنفاق الحكومي والتجارة. القراءة القوية قد تعزز العملات والأسهم عبر الإشارة إلى زخم نمو إيجابي، بينما القراءات الضعيفة قد تدفع المستثمرين نحو الحذر والأصول الآمنة.',
      'ويحلل المتداولون التقرير بما يتجاوز الرقم الكلي، لأن تغييرات الصادرات واستثمار الشركات وطلب المستهلك تكشف اتجاهات أعمق تؤثر في عدة أسواق على المدى المتوسط والطويل.'
    ]
  },
  {
    title: 'المخاطر الجيوسياسية',
    paragraphs: [
      'تتفاعل الأسواق المالية بقوة مع الأحداث الجيوسياسية مثل النزاعات التجارية والانتخابات والعقوبات والتوترات العسكرية. وقد أظهرت أحداث مثل مفاوضات بريكست وتوترات التجارة بين الولايات المتحدة والصين وقرارات أوبك قدرة هذه العوامل على خلق تقلبات مفاجئة في العملات والسلع والأسهم.',
      'في هذه الفترات، تجذب أصول الملاذ الآمن مثل الذهب والدولار الأمريكي والسندات الحكومية تدفقات أكبر، بينما تتعرض الأصول عالية المخاطر لضغوط. متابعة هذه التطورات تساعد المتداول على التكيف السريع وحماية مراكزه أو استغلال الفرص قصيرة الأجل.'
    ]
  }
] as const;

export async function ColbariMarketMoversPage({ appName, session }: ColbariMarketMoversPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'محركو السوق',
          title: 'محركو السوق',
          subtitle: 'فهم الأحداث التي تحرك الأسواق العالمية',
          intro:
            'يمكن تتبع كل حركة سعرية مهمة في الأسواق المالية إلى حدث أو تقرير أو قرار سياسي. يراقب المتداولون هذه التطورات لتوقع التقلبات وتعديل استراتيجياتهم. من قرارات الفائدة وبيانات التضخم إلى الناتج المحلي والتوترات الجيوسياسية، يؤثر كل عامل في معنويات السوق بطريقة مختلفة. وفهم سبب استجابة الأسواق لهذه المؤثرات يعد أساسا لبناء نهج تداول منضبط.',
          topics: marketMoverTopicsAr,
          sections: marketMoverSectionsAr,
          outro:
            'تتفاعل الأسواق يوميا مع البيانات والسياسات والأحداث. ومن خلال متابعة محركات السوق باستمرار، يستطيع المتداول اتخاذ قرارات أكثر انضباطا، وإدارة المخاطر بكفاءة أعلى، والاستفادة من الفرص بثقة.'
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Market Movers',
          title: 'Market Movers',
          subtitle: 'Understanding the Events That Move Global Markets',
          intro:
            'Every significant price movement in financial markets can be traced to an underlying event, report, or policy decision. Traders monitor these developments to anticipate volatility and adjust their strategies accordingly. From interest rate changes and inflation data to GDP figures and geopolitical tensions, each factor shapes market sentiment in unique ways. Recognizing how and why markets respond to these events is essential for building a disciplined trading approach.',
          topics: marketMoverSectionsEn.map((section) => section.title),
          sections: marketMoverSectionsEn,
          outro:
            'Markets react to data, policy, and events every day. By staying informed about these market movers, traders can respond strategically, manage risk more effectively, and navigate opportunities with discipline.'
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

            <p className="text-[15px] font-semibold leading-7 text-[#202325]">
              {content.topics.join(' | ')}
            </p>

            {content.sections.map((section) => (
              <div key={section.title} className="space-y-3 pt-1">
                <h2 className="text-[24px] font-semibold leading-8 text-[#1d2022]">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ))}

            <p className="pt-2 text-[18px] font-semibold italic leading-8 text-[#1d2022]">
              {content.outro}
            </p>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}
