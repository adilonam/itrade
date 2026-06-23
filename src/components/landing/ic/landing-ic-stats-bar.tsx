import { landingHomeTradingStats } from '@/constants/data';

export function LandingIcStatsBar() {
  return (
    <section className='shrink-0 border-b border-slate-900 bg-black px-6 py-10 lg:px-12'>
      <div className='mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0'>
        {landingHomeTradingStats.map((stat) => (
          <div key={stat.label} className='text-center'>
            <p className='text-3xl font-bold text-white md:text-4xl'>{stat.value}</p>
            <p className='mt-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase md:text-xs'>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
