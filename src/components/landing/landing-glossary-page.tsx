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

type LandingGlossaryPageProps = {
  appName: string;
  session: boolean;
};

type GlossaryEntry = {
  question: string;
  answer: string;
};

type GlossarySection = {
  title: string;
  items: GlossaryEntry[];
};

const glossarySectionsEn: GlossarySection[] = [
  {
    title: 'General Trading Terms',
    items: [
      {
        question: 'How is an account balance defined?',
        answer:
          "It is the total value available in a trader's account, including deposits and closed trade results, excluding open trade exposure."
      },
      {
        question: 'What does bid price mean?',
        answer:
          'The bid is the price a buyer is currently prepared to pay to acquire an asset.'
      },
      {
        question: 'What is the ask price?',
        answer:
          'The ask is the price a seller is willing to accept when selling an asset.'
      },
      {
        question: 'What is the spread in trading?',
        answer:
          'The spread is the difference between the buying price and the selling price shown on a quote.'
      }
    ]
  },
  {
    title: 'Trading Orders and Positions',
    items: [
      {
        question: 'What is a market order?',
        answer:
          'A market order is an instruction to trade immediately at the best available market price.'
      },
      {
        question: 'What is a limit order?',
        answer:
          'A limit order is an instruction to trade at a set price or better, waiting until the market reaches that level.'
      },
      {
        question: 'What is a stop-loss?',
        answer:
          'A stop-loss is a protective instruction to close a trade if the market reaches a chosen level, limiting losses.'
      },
      {
        question: 'What does it mean to go long?',
        answer:
          'Going long means buying an asset in expectation that its price will increase.'
      },
      {
        question: 'What does it mean to go short?',
        answer:
          'Going short means selling an asset first with the aim of buying it back later at a lower price.'
      }
    ]
  },
  {
    title: 'Leverage and Margin',
    items: [
      {
        question: 'What is leverage?',
        answer:
          'Leverage allows traders to control a larger market exposure than the funds they deposit, magnifying gains and losses.'
      },
      {
        question: 'What is margin?',
        answer:
          'Margin is the minimum amount of money required to open and maintain a leveraged trade.'
      },
      {
        question: 'What is a margin call?',
        answer:
          'A margin call is a request from the broker for additional funds when account equity falls below a required threshold.'
      }
    ]
  },
  {
    title: 'Market Analysis and Indicators',
    items: [
      {
        question: 'What is fundamental analysis?',
        answer:
          'Fundamental analysis evaluates an asset by using economic, political, and financial information.'
      },
      {
        question: 'What is technical analysis?',
        answer:
          'Technical analysis studies price history, chart structure, and indicators to anticipate possible future moves.'
      },
      {
        question: 'What are support and resistance levels?',
        answer:
          'Support is a price level where downward moves tend to slow, while resistance is a level where upward moves often pause.'
      },
      {
        question: 'What is a candlestick chart?',
        answer:
          'A candlestick chart displays the open, high, low, and close of price for a selected timeframe in a visual format.'
      }
    ]
  },
  {
    title: 'Forex and CFD Trading Terms',
    items: [
      {
        question: 'What is a currency pair?',
        answer:
          'A currency pair quotes one currency against another, such as EUR/USD, showing how much of one is needed to buy the other.'
      },
      {
        question: 'What are major, minor, and exotic pairs?',
        answer:
          'Major pairs are the most traded and include the USD. Minor pairs exclude the USD, while exotic pairs include currencies from emerging markets.'
      },
      {
        question: 'What is a CFD?',
        answer:
          'A Contract for Difference is a derivative that lets traders speculate on price changes without owning the underlying asset.'
      },
      {
        question: 'What is a swap in CFD trading?',
        answer:
          'A swap is an overnight financing adjustment applied while holding a CFD position overnight.'
      }
    ]
  }
];

const glossarySectionsAr: GlossarySection[] = [
  {
    title: 'مصطلحات التداول العامة',
    items: [
      {
        question: 'كيف يتم تعريف رصيد الحساب؟',
        answer:
          'هو إجمالي القيمة المتاحة في حساب المتداول، بما يشمل الإيداعات ونتائج الصفقات المغلقة، دون احتساب تعرض الصفقات المفتوحة.'
      },
      {
        question: 'ماذا يعني سعر الطلب من المشتري (Bid)؟',
        answer: 'هو السعر الذي يكون المشتري مستعدا لدفعه حاليا لشراء الأصل.'
      },
      {
        question: 'ما هو سعر العرض من البائع (Ask)؟',
        answer: 'هو السعر الذي يقبل به البائع عند بيع الأصل.'
      },
      {
        question: 'ما هو السبريد في التداول؟',
        answer:
          'السبريد هو الفرق بين سعر الشراء وسعر البيع الظاهرين في التسعير.'
      }
    ]
  },
  {
    title: 'أوامر التداول والمراكز',
    items: [
      {
        question: 'ما هو أمر السوق؟',
        answer: 'أمر السوق هو تعليمات للتنفيذ الفوري بأفضل سعر متاح حاليا.'
      },
      {
        question: 'ما هو الأمر المحدد (Limit)؟',
        answer:
          'هو أمر للتنفيذ عند سعر محدد أو أفضل منه عند وصول السوق إلى ذلك المستوى.'
      },
      {
        question: 'ما هو وقف الخسارة؟',
        answer: 'هو أمر حماية لإغلاق الصفقة عند مستوى تختاره للحد من الخسائر.'
      },
      {
        question: 'ماذا يعني فتح صفقة شراء (Long)؟',
        answer: 'يعني شراء الأصل مع توقع ارتفاع سعره.'
      },
      {
        question: 'ماذا يعني فتح صفقة بيع (Short)؟',
        answer: 'يعني بيع الأصل أولا بهدف إعادة شرائه لاحقا بسعر أقل.'
      }
    ]
  },
  {
    title: 'الرافعة والهامش',
    items: [
      {
        question: 'ما هي الرافعة المالية؟',
        answer:
          'الرافعة تتيح للمتداول التحكم في تعرض أكبر من رأس المال المودع، ما يضاعف الأرباح المحتملة وكذلك الخسائر.'
      },
      {
        question: 'ما هو الهامش؟',
        answer:
          'الهامش هو الحد الأدنى المطلوب لفتح صفقة برافعة مالية والحفاظ عليها.'
      },
      {
        question: 'ما هي نداءات الهامش (Margin Call)؟',
        answer:
          'هي مطالبة من الوسيط بإيداع أموال إضافية عندما تهبط حقوق الحساب دون المستوى المطلوب.'
      }
    ]
  },
  {
    title: 'تحليل السوق والمؤشرات',
    items: [
      {
        question: 'ما هو التحليل الأساسي؟',
        answer: 'التحليل الأساسي يقيم الأصل عبر بيانات اقتصادية وسياسية ومالية.'
      },
      {
        question: 'ما هو التحليل الفني؟',
        answer:
          'التحليل الفني يدرس تاريخ الأسعار وبنية الرسم والمؤشرات لاستشراف التحركات المحتملة.'
      },
      {
        question: 'ما هي مستويات الدعم والمقاومة؟',
        answer:
          'الدعم مستوى سعري تتباطأ عنده الحركة الهابطة، والمقاومة مستوى تميل عنده الحركة الصاعدة للتوقف.'
      },
      {
        question: 'ما هو مخطط الشموع؟',
        answer:
          'هو عرض بصري يوضح الافتتاح والأعلى والأدنى والإغلاق ضمن إطار زمني محدد.'
      }
    ]
  },
  {
    title: 'مصطلحات الفوركس وعقود الفروقات',
    items: [
      {
        question: 'ما هو زوج العملات؟',
        answer: 'زوج العملات يوضح قيمة عملة مقابل أخرى مثل EUR/USD.'
      },
      {
        question: 'ما المقصود بالأزواج الرئيسية والثانوية والنادرة؟',
        answer:
          'الأزواج الرئيسية هي الأكثر تداولا وتتضمن الدولار الأمريكي. الثانوية لا تتضمن الدولار، بينما النادرة تشمل عملات من أسواق ناشئة.'
      },
      {
        question: 'ما هي عقود الفروقات (CFD)؟',
        answer:
          'هي أداة مشتقة تتيح المضاربة على تغيرات الأسعار دون امتلاك الأصل الأساسي.'
      },
      {
        question: 'ما هو السواب في عقود الفروقات؟',
        answer:
          'السواب هو تسوية تمويلية ليلية تطبق عند الاحتفاظ بالصفقة لليوم التالي.'
      }
    ]
  }
];

export async function LandingGlossaryPage({
  appName,
  session
}: LandingGlossaryPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'المعجم',
          title: 'معجم عقود الفروقات',
          qLabel: 'س:',
          aLabel: 'ج:',
          sections: glossarySectionsAr
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Glossary',
          title: 'CFD-Glossary',
          qLabel: 'Q:',
          aLabel: 'A:',
          sections: glossarySectionsEn
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

          <h1 className='mb-8 text-[44px] leading-[1.1] font-semibold text-[#1a1c1c] md:text-[56px]'>
            {content.title}
          </h1>

          <div className='space-y-8 text-[15px] leading-8 text-[#2f3335]'>
            {content.sections.map((section) => (
              <div key={section.title} className='space-y-2'>
                <h2 className='text-[21px] font-semibold text-[#1f2325]'>
                  {section.title}
                </h2>
                {section.items.map((item) => (
                  <div key={item.question} className='space-y-1'>
                    <p>
                      <span className='font-semibold'>{content.qLabel}</span>{' '}
                      {item.question}
                    </p>
                    <p>
                      <span className='font-semibold'>{content.aLabel}</span>{' '}
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className='bg-[#f5f5f5]' />
    </main>
  );
}
