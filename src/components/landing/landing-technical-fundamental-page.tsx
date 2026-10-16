import { getLocale } from 'next-intl/server';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';

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
    <SmxMarketingShell appName={appName} session={session}>

      <section className="pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className="text-gray-100">{content.breadcrumbCurrent}</span>
          </div>

          <h1 className="mb-3 text-[44px] leading-[1.1] font-semibold text-gray-100 md:text-[56px]">
            {content.title}
          </h1>

          <p className="mb-7 text-[20px] font-semibold leading-8 text-white">
            {content.subtitle}
          </p>

          <div className="space-y-6 text-[16px] leading-8 text-gray-300">
            <p>{content.intro}</p>

            {content.sections.map((section) => (
              <div key={section.title} className="space-y-3 pt-1">
                <h2 className="text-[24px] font-semibold leading-8 text-white">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </SmxMarketingShell>
  );
}
