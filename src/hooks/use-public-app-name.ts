'use client';

import { useEffect, useState } from 'react';

const DEFAULT = 'Trade Nova';

export function usePublicAppName() {
  const [appName, setAppName] = useState(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/app-settings?label=appName')
      .then((r) => r.json())
      .then((data: { value?: unknown }) => {
        if (cancelled) return;
        if (typeof data.value === 'string' && data.value.trim()) {
          setAppName(data.value.trim());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return appName;
}
