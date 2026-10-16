'use client';

import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

const SCROLL_THRESHOLD = 10;

type LandingIcHomeScrollShellProps = {
  className: string;
  header: ReactElement<{ scrolled: boolean }>;
  children: ReactNode;
};

export function LandingIcHomeScrollShell({ className, header, children }: LandingIcHomeScrollShellProps) {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => setScrolled(el.scrollTop > SCROLL_THRESHOLD);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main ref={ref} className={className}>
      {isValidElement(header) ? cloneElement(header, { scrolled }) : header}
      {children}
    </main>
  );
}
