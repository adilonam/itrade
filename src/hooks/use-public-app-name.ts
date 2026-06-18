'use client';

import { DEFAULT_PUBLIC_APP_NAME } from '@/lib/public-app-name';

export function usePublicAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_PUBLIC_APP_NAME;
}
