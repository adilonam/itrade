import { getLocale } from 'next-intl/server';
import {
  IconClock,
  IconHeadset,
  IconLock,
  IconScale,
  IconShield,
  IconShieldCheck
} from '@tabler/icons-react';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';
import { withAppName } from '@/lib/public-app-name';

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

export async function LandingAboutUsPage({ appName, session }: LandingAboutUsPageProps) {
  const locale = await getLocale();
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
    <SmxMarketingShell appName={appName} session={session}>

      <section className="pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="mx-auto w-full max-w-[1060px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-[10px] tracking-wide text-gray-500">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className="text-gray-200">{content.breadcrumbCurrent}</span>
          </div>

          <h1 className="mb-8 text-[56px] leading-[1.05] font-semibold text-white">{content.title}</h1>

          <div className="space-y-6">
            {content.highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="flex items-start gap-5">
                  <div className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 text-gray-100">
                    <Icon className="size-7" stroke={1.6} />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="mb-1 text-[30px] leading-tight font-medium text-gray-100 md:text-[38px]">
                      {item.title}
                    </h2>
                    <p className="text-[20px] leading-7 text-gray-300 md:text-[18px]">
                      {withAppName(item.description, appName)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </SmxMarketingShell>
  );
}