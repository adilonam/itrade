import { cn } from "@/lib/utils"

type SectionShellProps = {
  children: React.ReactNode
  className?: string
}

export function SectionShell({ children, className }: SectionShellProps) {
  return (
    <section
      className={cn(
        "mx-auto max-w-(--spacing-container-max) px-(--spacing-margin-mobile) md:px-(--spacing-margin-desktop)",
        className
      )}
    >
      {children}
    </section>
  )
}
