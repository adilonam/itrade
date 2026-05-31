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

type ColbariNfpPageProps = {
  appName: string;
  session: boolean;
};

const nfpDatesEn = [
  { month: 'January', day: 2, time: '08:30' },
  { month: 'February', day: 6, time: '08:30' },
  { month: 'March', day: 6, time: '08:30' },
  { month: 'April', day: 3, time: '08:30' },
  { month: 'May', day: 1, time: '08:30' },
  { month: 'June', day: 5, time: '08:30' },
  { month: 'July', day: 3, time: '08:30' },
  { month: 'August', day: 7, time: '08:30' },
  { month: 'September', day: 4, time: '08:30' },
  { month: 'October', day: 2, time: '08:30' },
  { month: 'November', day: 6, time: '08:30' },
  { month: 'December', day: 4, time: '08:30' }
] as const;

const nfpDatesAr = [
  { month: 'يناير', day: 2, time: '08:30' },
  { month: 'فبراير', day: 6, time: '08:30' },
  { month: 'مارس', day: 6, time: '08:30' },
  { month: 'أبريل', day: 3, time: '08:30' },
  { month: 'مايو', day: 1, time: '08:30' },
  { month: 'يونيو', day: 5, time: '08:30' },
  { month: 'يوليو', day: 3, time: '08:30' },
  { month: 'أغسطس', day: 7, time: '08:30' },
  { month: 'سبتمبر', day: 4, time: '08:30' },
  { month: 'أكتوبر', day: 2, time: '08:30' },
  { month: 'نوفمبر', day: 6, time: '08:30' },
  { month: 'ديسمبر', day: 4, time: '08:30' }
] as const;

export async function ColbariNfpPage({ appName, session }: ColbariNfpPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'التعلم',
          breadcrumbCurrent: 'NFP',
          subtitle: 'الوظائف غير الزراعية',
          heading: 'فهم تقرير الوظائف غير الزراعية (NFP)',
          paragraph1:
            'يعد تقرير الوظائف غير الزراعية (NFP) من أهم البيانات الاقتصادية، إذ يعكس عدد الوظائف التي تمت إضافتها أو فقدانها في الاقتصاد الأمريكي، باستثناء عمال الزراعة والقطاع الحكومي وبعض الفئات الأخرى. ويصدر التقرير شهريا ضمن تقرير وضع التوظيف الصادر عن مكتب إحصاءات العمل.',
          reasonsTitle: 'تنبع أهمية التقرير من عدة أسباب:',
          reason1:
            'مؤشر لصحة الاقتصاد: يقدم صورة عن قوة سوق العمل الأمريكي من خلال وتيرة خلق الوظائف أو فقدانها.',
          reason2:
            'تأثيره على السياسة النقدية: البيانات القوية قد تدعم تشديد السياسة، والبيانات الضعيفة قد تزيد توقعات التيسير.',
          reason3:
            'تأثيره على الأسواق: يراقبه المستثمرون عالميا وقد يسبب تقلبات سريعة في وقت قصير.',
          paragraph2:
            'يتأثر الدولار الأمريكي وأزواج رئيسية مثل EUR/USD وGBP/USD وAUD/USD ببيانات NFP بشكل واضح. وإذا دعمت النتائج صورة نمو قوية مع تحسن الأجور، يميل الدولار إلى الارتفاع. أما تباطؤ التوظيف فقد يزيد مخاوف الركود ويضغط على العملة.',
          datesTitle: 'مواعيد تقرير الوظائف غير الزراعية لعام 2026',
          datesDescription:
            'يصدر التقرير عادة في أول جمعة من كل شهر، قبل افتتاح سوق الأسهم الأمريكية بساعة واحدة.',
          monthHeader: 'الشهر',
          dayHeader: 'اليوم',
          timeHeader: 'الوقت (نيويورك)',
          dates: nfpDatesAr
        }
      : {
          breadcrumbParent: 'Learning',
          breadcrumbCurrent: 'Nfp',
          subtitle: 'Non-Farm Payroll',
          heading: 'Understanding the Non-Farm Payroll (NFP) Report',
          paragraph1:
            'The Non-Farm Payroll (NFP) report is a key economic release that indicates the number of jobs added or lost in the U.S. economy, excluding farm workers, government employees, private household employees, and employees of nonprofit organizations. It is released monthly by the Bureau of Labor Statistics and is part of the broader Employment Situation report.',
          reasonsTitle: 'The NFP is important for several reasons:',
          reason1:
            'Economic Health Indicator: it provides insight into the health of the U.S. economy by showing how many jobs are being created or lost.',
          reason2:
            'Influence on Monetary Policy: strong jobs reports can support higher rates, while weak reports may increase expectations for policy easing.',
          reason3:
            'Market Impact: NFP is closely watched by investors and traders worldwide and can cause rapid volatility.',
          paragraph2:
            'The U.S. dollar and major forex pairs such as EUR/USD, GBP/USD, and AUD/USD are often highly influenced by NFP data. If results align with strong growth and wage conditions, the U.S. dollar tends to strengthen. Slower job growth and weaker labor data can increase recession concerns and pressure the currency.',
          datesTitle: 'The Non-Farm Payroll 2026 Dates',
          datesDescription:
            'The report is released on the first Friday of each month, one hour before the U.S. stock market opens.',
          monthHeader: 'Month',
          dayHeader: 'Day',
          timeHeader: 'Time (New York)',
          dates: nfpDatesEn
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

          <h1 className="mb-3 flex items-center gap-3 text-[44px] leading-[1.1] font-semibold text-[#1a1c1c] md:text-[56px]">
            <span className="text-[48px] leading-none">🇺🇸</span>
            <span>NFP</span>
          </h1>

          <p className="mb-7 text-[20px] leading-8 text-[#1f2325]">{content.subtitle}</p>

          <div className="space-y-6 text-[16px] leading-8 text-[#2f3335]">
            <p className="font-semibold text-[#1f2325]">{content.heading}</p>

            <p>{content.paragraph1}</p>

            <div>
              <p className="mb-2 font-semibold text-[#1f2325]">{content.reasonsTitle}</p>
              <ul className="list-disc space-y-1 ps-6">
                <li>{content.reason1}</li>
                <li>{content.reason2}</li>
                <li>{content.reason3}</li>
              </ul>
            </div>

            <p>{content.paragraph2}</p>

            <div className="space-y-3 pt-1">
              <h2 className="text-[24px] font-semibold leading-8 text-[#1d2022]">{content.datesTitle}</h2>
              <p>{content.datesDescription}</p>

              <div className="overflow-hidden border border-[#d1d3d4] bg-white shadow-sm">
                <table className="w-full border-collapse text-center text-sm">
                  <thead>
                    <tr className="bg-[#111] text-white">
                      <th className="border border-[#2a2a2a] px-4 py-3 font-medium">{content.monthHeader}</th>
                      <th className="border border-[#2a2a2a] px-4 py-3 font-medium">{content.dayHeader}</th>
                      <th className="border border-[#2a2a2a] px-4 py-3 font-medium">{content.timeHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.dates.map((item, index) => (
                      <tr key={item.month} className={index % 2 === 0 ? 'bg-[#f3f4f6]' : 'bg-[#e9ebee]'}>
                        <td className="border border-[#d1d3d4] px-4 py-3">{item.month}</td>
                        <td className="border border-[#d1d3d4] px-4 py-3">{item.day}</td>
                        <td className="border border-[#d1d3d4] px-4 py-3">{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}
