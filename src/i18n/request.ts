import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, localeCookieName } from '@/i18n/config';

type MessageTree = Record<string, unknown>;

async function loadPolymarketMessages(locale: string): Promise<MessageTree> {
  try {
    return (await import(`../../messages/polymarket/${locale}.json`)).default;
  } catch {
    return (await import(`../../messages/polymarket/en.json`)).default;
  }
}

function mergeMessages(
  base: MessageTree,
  polymarket: MessageTree
): MessageTree {
  const baseLanguage =
    base.Language && typeof base.Language === 'object'
      ? (base.Language as MessageTree)
      : {};
  const polyLanguage =
    polymarket.Language && typeof polymarket.Language === 'object'
      ? (polymarket.Language as MessageTree)
      : {};

  return {
    ...base,
    ...polymarket,
    // Both apps share the Language namespace with different keys.
    Language: { ...baseLanguage, ...polyLanguage }
  };
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const baseMessages = (await import(`../../messages/${locale}.json`))
    .default as MessageTree;
  const polymarketMessages = await loadPolymarketMessages(locale);

  return {
    locale,
    messages: mergeMessages(baseMessages, polymarketMessages)
  };
});
