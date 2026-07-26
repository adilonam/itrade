import Image from 'next/image';
import { brandAssets } from '@/constants/data';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** When true, swaps between light/dark logo assets based on theme. */
  themeAware?: boolean;
};

export function AppLogo({
  alt = '',
  className,
  width = 200,
  height = 48,
  priority = false,
  themeAware = true
}: AppLogoProps) {
  if (!themeAware) {
    return (
      <Image
        src={brandAssets.logo}
        alt={alt}
        width={width}
        height={height}
        className={cn('w-auto object-contain', className)}
        priority={priority}
      />
    );
  }

  return (
    <>
      <Image
        src={brandAssets.logoLight}
        alt={alt}
        width={width}
        height={height}
        className={cn('w-auto object-contain dark:hidden', className)}
        priority={priority}
      />
      <Image
        src={brandAssets.logoDark}
        alt={alt}
        width={width}
        height={height}
        className={cn('hidden w-auto object-contain dark:block', className)}
        priority={priority}
      />
    </>
  );
}
