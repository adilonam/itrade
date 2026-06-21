'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type BrandLogoImageProps = {
  src: string;
  alt: string;
  fallback: string;
  wrapperClassName: string;
};

export function BrandLogoImage({
  src,
  alt,
  fallback,
  wrapperClassName
}: BrandLogoImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative', wrapperClassName)}>
      {failed ? (
        <span className='font-mono text-xs text-[var(--trade-text-muted)]'>
          {fallback}
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className='box-border bg-white object-contain p-1.5'
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
