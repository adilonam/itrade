type MarketRulesProps = {
  rules: string[];
};

export function MarketRules({ rules }: MarketRulesProps) {
  return (
    <div className='rounded-xl border border-trade-border bg-trade-panel p-4'>
      <h3 className='mb-3 text-sm font-semibold text-trade-text'>Rules</h3>
      <ul className='space-y-2'>
        {rules.map((rule, i) => (
          <li
            key={i}
            className='flex gap-2 text-sm leading-relaxed text-trade-text-muted'
          >
            <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-trade-text-muted' />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
