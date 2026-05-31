import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EB_Garamond, Inter } from 'next/font/google';
import { IconPlus } from '@tabler/icons-react';
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

type ColbariLegalPageProps = {
  appName: string;
  session: boolean;
};

type LegalSection = {
  title: string;
  paragraphs: [string, string?];
};

const legalSectionsEn: LegalSection[] = [
  {
    title: 'Client Agreement',
    paragraphs: [
      'This agreement explains the relationship between you and the platform, including account operation, order handling, and communication standards.',
      'By using the service, you confirm that you understand your responsibilities, including providing accurate information and reviewing updates when terms change.'
    ]
  },
  {
    title: 'Complaints Procedure for Clients',
    paragraphs: [
      'If you are not satisfied with any aspect of the service, you can submit a formal complaint through the support channels listed in your client area.',
      'Each complaint is logged, investigated, and answered within a defined timeframe to ensure transparency and fair resolution.'
    ]
  },
  {
    title: 'Risk Disclosure',
    paragraphs: [
      'Trading CFDs involves significant risk and may not be suitable for all investors, especially when leverage is used in volatile market conditions.',
      'You should evaluate your financial situation and risk tolerance before trading, and never commit funds you cannot afford to lose.'
    ]
  },
  {
    title: 'General Fees',
    paragraphs: [
      'Applicable costs can include spreads, overnight financing adjustments, and account-related charges depending on your instrument and account type.',
      'A clear fee schedule is maintained so you can estimate total trading costs before entering positions.'
    ]
  },
  {
    title: 'Max Trade Size',
    paragraphs: [
      'Maximum position size limits are set to protect execution quality and maintain stable risk controls across available markets.',
      'These limits may differ by instrument, liquidity conditions, and account profile, and can be updated when market risk changes materially.'
    ]
  },
  {
    title: 'Trading Alerts',
    paragraphs: [
      'Platform alerts are informational notifications related to pricing, margin, and account activity and are designed to support timely decisions.',
      'Alerts do not constitute investment advice, and you remain responsible for monitoring your positions and account status.'
    ]
  },
  {
    title: 'Commodity and Index Rollover Information & Calculation',
    paragraphs: [
      'Certain instruments are subject to rollover adjustments when underlying contracts approach expiry and transition to the next period.',
      'Rollover calculations follow published methodology and may affect quoted prices and open positions to reflect underlying market continuity.'
    ]
  },
  {
    title: 'Company Information',
    paragraphs: [
      'Company details include registration, legal address, and licensing information required by applicable regulatory frameworks.',
      'This information is provided so clients can verify the operating entity and understand the jurisdiction governing services.'
    ]
  },
  {
    title: 'Privacy Policy',
    paragraphs: [
      'Personal data is processed for account administration, security, compliance, and support purposes according to data protection requirements.',
      'The policy also explains data retention periods, lawful processing basis, and your rights to access, correction, and deletion where applicable.'
    ]
  },
  {
    title: 'Terms of Use',
    paragraphs: [
      'These terms define acceptable platform use, intellectual property boundaries, and limitations related to service availability.',
      'Continued access to the platform means you accept the current terms, including any future revisions communicated through official channels.'
    ]
  },
  {
    title: 'Margin Information',
    paragraphs: [
      'Margin requirements determine the minimum collateral needed to open and maintain leveraged positions across different asset classes.',
      'If margin levels fall below required thresholds, risk controls such as margin calls or automatic position closures may apply.'
    ]
  },
  {
    title: 'Bonus Terms & Conditions',
    paragraphs: [
      'Any promotional offer is governed by specific eligibility criteria, usage restrictions, and withdrawal rules outlined in the campaign terms.',
      'Promotions are optional and should be reviewed carefully to understand how they affect trading activity and account balances.'
    ]
  },
  {
    title: 'AML Policy',
    paragraphs: [
      'The platform applies anti-money laundering controls that include client identification, transaction monitoring, and risk-based verification checks.',
      'These measures help prevent financial crime and may require additional documentation before deposits, withdrawals, or account changes are approved.'
    ]
  }
];

const legalSectionsAr: LegalSection[] = [
  {
    title: 'اتفاقية العميل',
    paragraphs: [
      'توضح هذه الاتفاقية العلاقة بينك وبين المنصة، بما في ذلك تشغيل الحساب وتنفيذ الأوامر وآليات التواصل.',
      'باستخدامك للخدمة، فإنك تقر بمسؤوليتك عن تقديم بيانات صحيحة ومراجعة أي تحديثات تطرأ على الشروط.'
    ]
  },
  {
    title: 'إجراءات شكاوى العملاء',
    paragraphs: [
      'في حال وجود أي ملاحظة أو اعتراض، يمكنك تقديم شكوى رسمية عبر قنوات الدعم المعتمدة في منطقة العميل.',
      'تتم متابعة كل شكوى وتوثيقها والرد عليها خلال إطار زمني واضح لضمان الشفافية والإنصاف.'
    ]
  },
  {
    title: 'الإفصاح عن المخاطر',
    paragraphs: [
      'تداول عقود الفروقات ينطوي على مخاطر مرتفعة وقد لا يكون مناسباً لجميع المستثمرين، خاصة عند استخدام الرافعة المالية.',
      'ينبغي تقييم وضعك المالي وقدرتك على تحمل المخاطر قبل التداول، وعدم المخاطرة بأموال لا يمكنك تحمل خسارتها.'
    ]
  },
  {
    title: 'الرسوم العامة',
    paragraphs: [
      'قد تشمل الرسوم فروقات الأسعار وتكاليف التبييت ورسوم مرتبطة بالحساب بحسب نوع الأداة ونوع الحساب.',
      'يتم عرض هيكل الرسوم بشكل واضح حتى تتمكن من تقدير التكلفة الإجمالية قبل فتح الصفقات.'
    ]
  },
  {
    title: 'الحد الأقصى لحجم الصفقة',
    paragraphs: [
      'يتم تحديد حدود قصوى لحجم المراكز للحفاظ على جودة التنفيذ وضبط المخاطر في مختلف الأسواق.',
      'قد تختلف هذه الحدود حسب الأداة والسيولة ونوع الحساب، ويمكن تعديلها مع تغير ظروف السوق.'
    ]
  },
  {
    title: 'تنبيهات التداول',
    paragraphs: [
      'تنبيهات المنصة هي إشعارات معلوماتية تتعلق بالأسعار والهامش وحركة الحساب لمساعدتك في المتابعة.',
      'لا تُعد هذه التنبيهات توصية استثمارية، وتبقى مسؤولية إدارة الصفقات ومراقبة الحساب على عاتقك.'
    ]
  },
  {
    title: 'معلومات واحتساب ترحيل السلع والمؤشرات',
    paragraphs: [
      'تخضع بعض الأدوات لتعديلات ترحيل عند اقتراب انتهاء العقود الأساسية والانتقال إلى الفترة التالية.',
      'يتم احتساب الترحيل وفق منهجية معلنة وقد يؤثر ذلك في الأسعار المعروضة والمراكز المفتوحة للحفاظ على استمرارية التسعير.'
    ]
  },
  {
    title: 'معلومات الشركة',
    paragraphs: [
      'تشمل هذه الفقرة بيانات التسجيل والعنوان القانوني ومعلومات الترخيص المطلوبة بموجب الأطر التنظيمية.',
      'يتم توفير هذه المعلومات لتمكين العميل من التحقق من الجهة التشغيلية والاختصاص القانوني للخدمات.'
    ]
  },
  {
    title: 'سياسة الخصوصية',
    paragraphs: [
      'تتم معالجة البيانات الشخصية لأغراض إدارة الحساب والأمن والامتثال وخدمة العملاء وفقا لمتطلبات حماية البيانات.',
      'كما توضح السياسة فترات الاحتفاظ بالبيانات والأساس القانوني للمعالجة وحقوقك في الاطلاع والتصحيح والحذف حسب الأنظمة المعمول بها.'
    ]
  },
  {
    title: 'شروط الاستخدام',
    paragraphs: [
      'تحدد هذه الشروط أسلوب الاستخدام المقبول للمنصة وحدود الملكية الفكرية والقيود المتعلقة بتوفر الخدمة.',
      'استمرار استخدام المنصة يعني الموافقة على الشروط السارية وأي تحديثات يتم الإعلان عنها عبر القنوات الرسمية.'
    ]
  },
  {
    title: 'معلومات الهامش',
    paragraphs: [
      'متطلبات الهامش تحدد الحد الأدنى من الضمان اللازم لفتح المراكز ذات الرافعة والاحتفاظ بها عبر فئات الأصول.',
      'عند انخفاض مستوى الهامش عن الحد المطلوب قد يتم تطبيق نداءات الهامش أو إغلاق تلقائي للمراكز كإجراء وقائي.'
    ]
  },
  {
    title: 'شروط وأحكام المكافآت',
    paragraphs: [
      'أي عرض ترويجي يخضع لشروط أهلية وحدود استخدام وقواعد سحب موضحة ضمن تفاصيل الحملة.',
      'المكافآت اختيارية، ويجب مراجعة شروطها بعناية لفهم تأثيرها على نشاط التداول وأرصدة الحساب.'
    ]
  },
  {
    title: 'سياسة مكافحة غسل الأموال',
    paragraphs: [
      'تطبق المنصة ضوابط مكافحة غسل الأموال، بما يشمل التحقق من الهوية ومراقبة العمليات وتقييم المخاطر.',
      'قد تتطلب هذه الضوابط مستندات إضافية قبل اعتماد بعض الإيداعات أو السحوبات أو تعديلات الحساب.'
    ]
  }
];

export async function ColbariLegalPage({ appName, session }: ColbariLegalPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'الحساب',
          breadcrumbCurrent: 'قانوني',
          title: 'قانوني',
          sections: legalSectionsAr
        }
      : {
          breadcrumbParent: 'Account',
          breadcrumbCurrent: 'Legal',
          title: 'Legal',
          sections: legalSectionsEn
        };

  const leftColumn = content.sections.slice(0, 7);
  const rightColumn = content.sections.slice(7);

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
        <div className="mx-auto w-full max-w-[1220px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-[10px] tracking-wide text-[#8a8d8f]">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span className="text-[#26292a]">{content.breadcrumbCurrent}</span>
          </div>

          <h1 className="mb-10 text-[56px] leading-[1.05] font-semibold text-[#222526]">{content.title}</h1>

          <div className="grid gap-x-16 gap-y-0 md:grid-cols-2">
            <div>
              {leftColumn.map((section) => (
                <details key={section.title} className="group border-b border-[#b6b8ba] py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[31px] leading-tight font-medium text-[#1f2223] marker:content-none md:text-[30px]">
                    <span className="text-[18px] leading-7 md:text-[31px] md:leading-tight">{section.title}</span>
                    <span className="grid size-8 shrink-0 place-items-center text-[#8e9092] transition-transform duration-150 group-open:rotate-45">
                      <IconPlus className="size-5" stroke={2} />
                    </span>
                  </summary>
                  <div className="pb-4 text-[14px] leading-7 text-[#434648]">
                    <p>{section.paragraphs[0]}</p>
                    {section.paragraphs[1] ? <p className="mt-3">{section.paragraphs[1]}</p> : null}
                  </div>
                </details>
              ))}
            </div>

            <div>
              {rightColumn.map((section) => (
                <details key={section.title} className="group border-b border-[#b6b8ba] py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[31px] leading-tight font-medium text-[#1f2223] marker:content-none md:text-[30px]">
                    <span className="text-[18px] leading-7 md:text-[31px] md:leading-tight">{section.title}</span>
                    <span className="grid size-8 shrink-0 place-items-center text-[#8e9092] transition-transform duration-150 group-open:rotate-45">
                      <IconPlus className="size-5" stroke={2} />
                    </span>
                  </summary>
                  <div className="pb-4 text-[14px] leading-7 text-[#434648]">
                    <p>{section.paragraphs[0]}</p>
                    {section.paragraphs[1] ? <p className="mt-3">{section.paragraphs[1]}</p> : null}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}