import { Footer } from "@/components/polymarket/landing/footer"

type AdminPageShellProps = {
  children: React.ReactNode
}

/** Content shell matching home header alignment (Header stays outside). */
export async function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <div className="pt-20">
      <div className="mx-auto max-w-(--spacing-container-max) px-(--spacing-margin-mobile) py-8 md:px-(--spacing-margin-desktop)">
        {children}
      </div>
      <Footer />
    </div>
  )
}
