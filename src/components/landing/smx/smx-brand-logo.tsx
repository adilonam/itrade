import Image from 'next/image';
import Link from 'next/link';
import { brandAssets } from '@/constants/data';

type SmxBrandLogoProps = {
  href?: string;
  className?: string;
};

export function SmxBrandLogo({ href = '/#top', className = '' }: SmxBrandLogoProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-start leading-none ${className}`}
      aria-label="SMX"
    >
      <Image
        src={brandAssets.logo}
        alt="SMX"
        width={160}
        height={54}
        className="h-10 w-auto object-contain transition-opacity group-hover:opacity-90 sm:h-11"
        priority
      />
      <span className="mt-1 font-sans text-[9px] tracking-widest text-gray-400 uppercase">
        Trade A Bigger Tomorrow
      </span>
    </Link>
  );
}
