type AuthDividerProps = {
  label: string
}

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="border-outline-variant/60 dark:border-on-secondary-container absolute inset-0 flex items-center">
        <div className="w-full border-t" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface-white dark:bg-on-secondary-fixed text-on-surface-variant dark:text-secondary-fixed-dim px-3 text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}
