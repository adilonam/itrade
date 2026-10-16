import { getLocale } from 'next-intl/server';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';

type LandingTradingPitfallsPageProps = {
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

export async function LandingTradingPitfallsPage({
  appName,
  session
}: LandingTradingPitfallsPageProps) {
  const locale = await getLocale();
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
            <p>{content.paragraph1}</p>

            <p>{content.paragraph2}</p>

            <div className="space-y-2 pt-1">
              <h2 className="text-[24px] font-semibold leading-8 text-white">
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
    </SmxMarketingShell>
  );
}
