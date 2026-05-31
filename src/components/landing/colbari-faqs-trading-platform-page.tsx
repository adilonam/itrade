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

type ColbariFaqsTradingPlatformPageProps = {
  appName: string;
  session: boolean;
};

const faqItemsEn = [
  {
    question: 'How is a trading account created?',
    answer:
      'Complete the registration form, verify your email, and submit your KYC documents. After approval, you can fund your account and begin trading.'
  },
  {
    question: 'What does CFD stand for?',
    answer:
      'CFD means Contract for Difference. It allows you to speculate on price movement without owning the underlying asset directly.'
  },
  {
    question: 'Why is leverage offered?',
    answer:
      'Leverage gives access to larger exposure using a smaller margin deposit. It can magnify profits and losses, so risk controls are essential.'
  },
  {
    question: 'What role does lot size play?',
    answer:
      'Lot size determines the size of your position. Larger lots can increase potential returns and risks, while smaller lots reduce exposure.'
  },
  {
    question: 'How are pips measured?',
    answer:
      'A pip is usually the fourth decimal place in most currency pairs, or the second decimal place for JPY pairs. It represents a unit of price movement.'
  },
  {
    question: 'Why is margin important?',
    answer:
      'Margin is the collateral needed to keep leveraged positions open. Monitoring free margin helps prevent stop-outs during volatile moves.'
  },
  {
    question: 'How do I add funds to my account?',
    answer:
      'Use the deposit section in your client area, choose a payment method, and follow the instructions. Available methods depend on your region.'
  },
  {
    question: 'What is the process for withdrawing funds?',
    answer:
      'Submit a withdrawal request from your dashboard. After compliance checks, funds are returned to your approved payment method.'
  },
  {
    question: 'How can I update my account information?',
    answer:
      'Open account settings, edit your profile details, and save. Some fields may require document re-verification before changes are confirmed.'
  },
  {
    question: 'Can I use MetaTrader with this platform?',
    answer:
      'Instrument and platform availability may vary by account type. Contact support to confirm whether MetaTrader integration is available for your setup.'
  },
  {
    question: 'What if I forgot my password?',
    answer:
      'Use the Forgot Password option on the login page. A reset link will be sent to your registered email address.'
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can reach support through live chat, email, or phone during support hours. Account-related requests may require identity checks.'
  },
  {
    question: 'Is my personal data secure?',
    answer:
      'Yes. Data is protected using encryption, access controls, and compliance processes aligned with applicable regulatory standards.'
  },
  {
    question: 'What should I do if a trade is not executed?',
    answer:
      'Check market status, margin level, and order parameters first. If the issue continues, submit the order details to support for investigation.'
  },
  {
    question: 'Can I open more than one account?',
    answer:
      'Multiple accounts may be available based on jurisdiction and account policy. Contact support for account structure options.'
  },
  {
    question: 'What types of instruments can I trade?',
    answer:
      'Depending on your account, you may access forex, commodities, indices, stocks, and cryptocurrencies through CFD products.'
  },
  {
    question: 'Is there a minimum deposit?',
    answer:
      'Minimum deposit requirements vary by account type and funding method. You can review the current requirement during deposit.'
  },
  {
    question: 'Why was my position closed automatically?',
    answer:
      'Positions can be closed automatically when margin thresholds are breached or protective orders like stop loss are triggered.'
  },
  {
    question: 'How can I verify my account?',
    answer:
      'Upload a valid identity document and proof of address in your profile section. Verification is reviewed by the compliance team.'
  },
  {
    question: 'Can I trade from mobile devices?',
    answer:
      'Yes. You can access your account from mobile browser or supported mobile apps, depending on the platform configuration.'
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Processing times vary by method and compliance checks, but most approved withdrawals are handled within standard business days.'
  },
  {
    question: "I can\'t log in. What should I do?",
    answer:
      'Confirm your credentials, clear browser cache, and reset password if needed. If access is still blocked, contact support for account review.'
  },
  {
    question: 'Unsubscribing from notifications',
    answer:
      'Open notification preferences in your profile and disable the channels you no longer want. Essential security messages may still be sent.'
  }
] as const;

const faqItemsAr = [
  {
    question: 'كيف يتم إنشاء حساب تداول؟',
    answer:
      'املأ نموذج التسجيل، ثم فعّل بريدك الإلكتروني وأرسل مستندات التحقق. بعد الموافقة يمكنك إيداع الأموال والبدء في التداول.'
  },
  {
    question: 'ماذا يعني CFD؟',
    answer:
      'CFD اختصار لعقد الفروقات، وهو يتيح المضاربة على حركة السعر دون امتلاك الأصل الأساسي بشكل مباشر.'
  },
  {
    question: 'لماذا يتم تقديم الرافعة المالية؟',
    answer:
      'الرافعة تمنح تعرضا أكبر بإيداع هامش أقل، وقد تضاعف الأرباح والخسائر، لذلك تعد إدارة المخاطر أمرا أساسيا.'
  },
  {
    question: 'ما دور حجم اللوت؟',
    answer:
      'حجم اللوت يحدد حجم المركز. اللوت الأكبر يرفع العائد المحتمل والمخاطر، بينما اللوت الأصغر يقلل التعرض.'
  },
  {
    question: 'كيف يتم قياس النقاط (Pips)؟',
    answer:
      'النقطة غالبا هي الرقم الرابع بعد الفاصلة في معظم أزواج العملات، أو الرقم الثاني في أزواج الين. وهي وحدة لقياس حركة السعر.'
  },
  {
    question: 'لماذا يعد الهامش مهما؟',
    answer:
      'الهامش هو الضمان المطلوب للحفاظ على الصفقات ذات الرافعة. مراقبة الهامش الحر تساعد على تجنب الإغلاق القسري في فترات التقلب.'
  },
  {
    question: 'كيف أضيف أموالا إلى حسابي؟',
    answer: 'استخدم قسم الإيداع في منطقة العميل، اختر طريقة الدفع واتبع التعليمات. الطرق المتاحة تختلف حسب المنطقة.'
  },
  {
    question: 'ما آلية سحب الأموال؟',
    answer: 'قدّم طلب سحب من لوحة التحكم. بعد فحوص الامتثال يتم تحويل الأموال إلى وسيلة الدفع المعتمدة.'
  },
  {
    question: 'كيف أستطيع تحديث بيانات حسابي؟',
    answer: 'افتح إعدادات الحساب، عدّل البيانات ثم احفظ. بعض الحقول قد تتطلب إعادة التحقق بالمستندات.'
  },
  {
    question: 'هل يمكنني استخدام MetaTrader مع المنصة؟',
    answer: 'قد يختلف توفر المنصات والأدوات حسب نوع الحساب. تواصل مع الدعم للتأكد من إتاحة التكامل لديك.'
  },
  {
    question: 'ماذا أفعل إذا نسيت كلمة المرور؟',
    answer: 'استخدم خيار نسيت كلمة المرور في صفحة الدخول، وسيتم إرسال رابط إعادة التعيين إلى بريدك المسجل.'
  },
  {
    question: 'كيف يمكنني التواصل مع الدعم؟',
    answer: 'يمكنك التواصل عبر الدردشة الحية أو البريد الإلكتروني أو الهاتف خلال ساعات الدعم.'
  },
  {
    question: 'هل بياناتي الشخصية آمنة؟',
    answer: 'نعم. يتم حماية البيانات عبر التشفير وضوابط الوصول وإجراءات امتثال متوافقة مع المعايير التنظيمية.'
  },
  {
    question: 'ماذا أفعل إذا لم يتم تنفيذ صفقة؟',
    answer:
      'تحقق أولا من حالة السوق ومستوى الهامش وإعدادات الأمر. إذا استمر الأمر، أرسل تفاصيل الصفقة إلى الدعم للمراجعة.'
  },
  {
    question: 'هل يمكنني فتح أكثر من حساب؟',
    answer: 'قد تتاح حسابات متعددة حسب الولاية التنظيمية وسياسة الحساب. تواصل مع الدعم لمعرفة الخيارات.'
  },
  {
    question: 'ما أنواع الأدوات التي يمكنني تداولها؟',
    answer: 'حسب نوع الحساب، يمكنك تداول الفوركس والسلع والمؤشرات والأسهم والعملات المشفرة عبر عقود الفروقات.'
  },
  {
    question: 'هل يوجد حد أدنى للإيداع؟',
    answer: 'الحد الأدنى يختلف حسب نوع الحساب وطريقة التمويل ويمكنك مراجعته أثناء عملية الإيداع.'
  },
  {
    question: 'لماذا أُغلق مركزي تلقائيا؟',
    answer: 'قد تُغلق المراكز تلقائيا عند اختراق حدود الهامش أو عند تفعيل أوامر الحماية مثل وقف الخسارة.'
  },
  {
    question: 'كيف أوثق حسابي؟',
    answer: 'ارفع مستند هوية ساري وإثبات عنوان من قسم الملف الشخصي، ثم يراجع فريق الامتثال الطلب.'
  },
  {
    question: 'هل يمكنني التداول من الهاتف المحمول؟',
    answer: 'نعم، يمكنك الوصول إلى الحساب عبر متصفح الهاتف أو التطبيقات المدعومة حسب إعداد المنصة.'
  },
  {
    question: 'كم تستغرق عمليات السحب؟',
    answer: 'تختلف المدة حسب طريقة الدفع وفحوص الامتثال، لكن معظم السحوبات المعتمدة تعالج خلال أيام عمل اعتيادية.'
  },
  {
    question: 'لا أستطيع تسجيل الدخول. ماذا أفعل؟',
    answer: 'تحقق من بيانات الدخول وامسح ذاكرة المتصفح أو أعد تعيين كلمة المرور. إذا استمرت المشكلة تواصل مع الدعم.'
  },
  {
    question: 'إلغاء الاشتراك في الإشعارات',
    answer: 'افتح إعدادات الإشعارات في ملفك الشخصي وأوقف القنوات التي لا تريدها. قد تستمر رسائل الأمان الأساسية.'
  }
] as const;

export async function ColbariFaqsTradingPlatformPage({
  appName,
  session
}: ColbariFaqsTradingPlatformPageProps) {
  const locale = await getLocale();
  const tradeHref = session ? landingPageLinks.trade : landingPageLinks.signIn;
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'الحساب',
          breadcrumbMiddle: 'الأسئلة الشائعة - منصة التداول',
          breadcrumbCurrent: 'عام',
          sidebarTitle: 'عام',
          pageTitle: 'عام',
          faqItems: faqItemsAr
        }
      : {
          breadcrumbParent: 'Account',
          breadcrumbMiddle: 'Faqs - Trading Platform',
          breadcrumbCurrent: 'General',
          sidebarTitle: 'General',
          pageTitle: 'General',
          faqItems: faqItemsEn
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
          <div className="mb-8 flex items-center gap-2 text-[10px] tracking-wide text-[#8a8d8f]">
            <span>{content.breadcrumbParent}</span>
            <span>/</span>
            <span>{content.breadcrumbMiddle}</span>
            <span>/</span>
            <span className="text-[#26292a]">{content.breadcrumbCurrent}</span>
          </div>

          <div className="grid gap-8 md:grid-cols-[130px_minmax(0,1fr)] md:gap-12">
            <aside className="pt-5 text-sm font-semibold text-[#272a2c]">{content.sidebarTitle}</aside>

            <div>
              <h1 className="mb-8 text-[56px] leading-[1.05] font-semibold text-[#222526]">{content.pageTitle}</h1>

              <div className="space-y-1.5">
                {content.faqItems.map((item) => (
                  <details key={item.question} className="group border border-[#c7cacc] bg-[#ececec]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-3 text-[13px] font-medium text-[#1f2223] marker:content-none">
                      <span>{item.question}</span>
                      <span className="grid size-5 shrink-0 place-items-center rounded-[2px] bg-[#1d2022] text-white">
                        <IconPlus className="size-3" stroke={2.2} />
                      </span>
                    </summary>
                    <div className="border-t border-[#c7cacc] bg-[#f6f6f6] px-3 py-3 text-[13px] leading-6 text-[#3a3d40]">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingSiteFooter appName={appName} className="bg-[#f5f5f5]" />
    </main>
  );
}