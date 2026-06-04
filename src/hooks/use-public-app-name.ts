'use client';

const DEFAULT = 'Trade Nova';

export function usePublicAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT;
}
