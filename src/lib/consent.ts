export const CONSENT_SIGNED_EVENT = 'itrade:consent-signed';

export const consentPagePath = '/consent';

export function markConsentSignedEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSENT_SIGNED_EVENT));
}

export function shouldSkipConsentGate(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === consentPagePath || pathname.startsWith(`${consentPagePath}/`)) {
    return true;
  }
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/api')) return true;
  return false;
}
