import { getTranslations } from "next-intl/server"

import { auth } from "@/lib/polymarket/auth-session"
import { Link } from "@/lib/polymarket/routing"
import { UserAvatarMenu } from "@/components/polymarket/auth/user-avatar-menu"

export async function UserMenu() {
  const session = await auth()
  const t = await getTranslations("Header")

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/sign-in"
          className="font-label text-label-caps text-primary hover:bg-surface-container-low hidden rounded-lg border border-primary px-4 py-2 transition-colors duration-200 md:inline-block"
        >
          {t("login")}
        </Link>
        <Link
          href="/sign-up"
          className="font-label text-label-caps bg-primary-container hover:bg-primary active:scale-95 rounded-lg px-4 py-2 text-white transition-colors duration-200"
        >
          {t("register")}
        </Link>
      </div>
    )
  }

  return (
    <UserAvatarMenu
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
    />
  )
}
