'use client';

import { useState } from 'react';

type BrandLogoImageProps = {
  src: string;
  alt: string;
  fallback: string;
  wrapperClassName: string;
};

export function BrandLogoImage({ src, alt, fallback, wrapperClassName }: BrandLogoImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={wrapperClassName}>
      {failed ? (
        <span className="font-mono text-xs text-[var(--trade-text-muted)]">{fallback}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 box-border h-full w-full bg-white object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
