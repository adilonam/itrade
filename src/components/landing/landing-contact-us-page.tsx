import { getLocale } from 'next-intl/server';
import { IconMail, IconMessageCircle } from '@tabler/icons-react';
import { SmxMarketingShell } from '@/components/landing/smx/smx-marketing-shell';
import { getSupportEmail } from '@/lib/app-url';

type LandingContactUsPageProps = {
  appName: string;
  session: boolean;
};

export async function LandingContactUsPage({ appName, session }: LandingContactUsPageProps) {
  const locale = await getLocale();
  const supportEmail = await getSupportEmail();
  const content =
    locale === 'ar'
      ? {
          breadcrumbParent: 'الحساب',
          breadcrumbCurrent: 'تواصل معنا',
          title: 'تواصل معنا',
          subtitle:
            'نحن هنا لمساعدتك. أرسل استفسارك إلى بريد الدعم وسيقوم فريقنا بالرد عليك في أقرب وقت.',
          ctaLabel: 'راسل الدعم الآن',
          note: 'يفضل تضمين رقم حسابك أو بيانات الطلب لتسريع المتابعة.'
        }
      : {
          breadcrumbParent: 'Account',
          breadcrumbCurrent: 'Contact Us',
          title: 'Contact Us',
          subtitle:
            'We are here to help. Send your questions to our support inbox and our team will get back to you as soon as possible.',
          ctaLabel: 'Email Support',
          note: 'Please include your account number or request details to speed up support.'
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

          <h1 className="mb-4 text-[52px] leading-[1.05] font-semibold text-white md:text-[64px]">
            {content.title}
          </h1>
          <p className="mb-10 max-w-[820px] text-[18px] leading-8 text-gray-300 md:text-[20px]">
            {content.subtitle}
          </p>

          <article className="rounded-2xl border border-white/15 bg-white/5 p-7 shadow-none md:p-10">
            <div className="mb-6 flex items-center gap-3 text-white">
              <div className="grid size-11 place-items-center rounded-full bg-[#D8A84E]/15 text-[#D8A84E]">
                <IconMessageCircle className="size-5" stroke={1.8} />
              </div>
              <p className="text-[22px] leading-tight font-medium md:text-[28px]">Support</p>
            </div>

            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#D8A84E]/50 bg-[#D8A84E]/15 px-5 py-2.5 text-[16px] font-medium text-[#E8BF6C] transition-colors hover:bg-[#D8A84E]/25"
            >
              <IconMail className="size-4" stroke={1.8} />
              {content.ctaLabel}: {supportEmail}
            </a>

            <p className="mt-5 text-sm leading-6 text-gray-400">{content.note}</p>
          </article>
        </div>
      </section>
    </SmxMarketingShell>
  );
}
