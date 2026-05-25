import { useSyncExternalStore } from 'react';

export const MOBILE_BREAKPOINT = 768;

const mobileQuery = () => `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribeMobile(onStoreChange: () => void) {
  const mql = window.matchMedia(mobileQuery());
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery()).matches;
}

function getMobileServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}
