"use client"

import { useTranslations } from "next-intl"

import { AutoGeneratePanel } from "@/components/polymarket/admin/generate-market/auto-generate-panel"
import { ManualMarketPanel } from "@/components/polymarket/admin/generate-market/manual-market-panel"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/polymarket/ui/tabs"
import type { ManageableMarket } from "@/lib/polymarket/admin/generate-market-queries"

export function GenerateMarketClient({
  markets,
}: {
  markets: ManageableMarket[]
}) {
  const t = useTranslations("Admin")

  return (
    <Tabs defaultValue="auto" className="w-full">
      <TabsList>
        <TabsTrigger value="auto">{t("generateTabAuto")}</TabsTrigger>
        <TabsTrigger value="manual">{t("generateTabManual")}</TabsTrigger>
      </TabsList>
      <TabsContent value="auto" className="mt-6">
        <AutoGeneratePanel />
      </TabsContent>
      <TabsContent value="manual" className="mt-6">
        <ManualMarketPanel markets={markets} />
      </TabsContent>
    </Tabs>
  )
}
