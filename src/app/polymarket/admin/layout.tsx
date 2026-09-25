import { redirect } from "@/lib/polymarket/routing-server"
import { auth } from "@/lib/polymarket/auth-session"
import { isPolymarketAdmin } from "@/lib/polymarket/roles"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (!isPolymarketAdmin(session.user.role)) {
    redirect("/")
  }

  return <div className="bg-surface min-h-screen">{children}</div>
}
