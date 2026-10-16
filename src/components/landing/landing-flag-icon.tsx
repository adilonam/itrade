type LandingFlagIconProps = {
  country: string;
  className?: string;
};

/** Compact flag icons for the landing language menu. */
export function LandingFlagIcon({
  country,
  className = 'h-4 w-6 rounded-sm'
}: LandingFlagIconProps) {
  switch (country) {
    case 'gb':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='60' height='40' fill='#012169' />
          <path d='M0 0L60 40M60 0L0 40' stroke='#fff' strokeWidth='8' />
          <path d='M0 0L60 40M60 0L0 40' stroke='#C8102E' strokeWidth='5' />
          <path d='M30 0V40M0 20H60' stroke='#fff' strokeWidth='12' />
          <path d='M30 0V40M0 20H60' stroke='#C8102E' strokeWidth='7' />
        </svg>
      );
    case 'es':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='60' height='40' fill='#AA151B' />
          <rect y='10' width='60' height='20' fill='#F1BF00' />
        </svg>
      );
    case 'sa':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='60' height='40' fill='#006C35' />
          <text
            x='30'
            y='26'
            fill='#fff'
            fontSize='10'
            textAnchor='middle'
            fontFamily='serif'
          >
            ☪
          </text>
        </svg>
      );
    case 'fr':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='20' height='40' fill='#002395' />
          <rect x='20' width='20' height='40' fill='#fff' />
          <rect x='40' width='20' height='40' fill='#ED2939' />
        </svg>
      );
    case 'de':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='60' height='13.33' fill='#000' />
          <rect y='13.33' width='60' height='13.34' fill='#DD0000' />
          <rect y='26.67' width='60' height='13.33' fill='#FFCE00' />
        </svg>
      );
    case 'pt':
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='24' height='40' fill='#006600' />
          <rect x='24' width='36' height='40' fill='#FF0000' />
          <circle
            cx='24'
            cy='20'
            r='7'
            fill='#FF0000'
            stroke='#FFD700'
            strokeWidth='1'
          />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox='0 0 60 40' aria-hidden>
          <rect width='60' height='40' fill='#ccc' />
        </svg>
      );
  }
}
