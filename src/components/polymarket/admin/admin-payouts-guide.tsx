import { getTranslations } from "next-intl/server"

import { Badge } from "@/components/polymarket/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/polymarket/ui/card"

function LedgerBadge({ children }: { children: string }) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs font-normal tracking-tight"
    >
      {children}
    </Badge>
  )
}

export async function AdminPayoutsGuide() {
  const t = await getTranslations("Admin")

  const mechanics = [
    {
      title: t("payoutsBuyTitle"),
      body: t("payoutsBuyBody"),
      formula: t("payoutsBuyFormula"),
      ledger: "trade_buy",
    },
    {
      title: t("payoutsSellTitle"),
      body: t("payoutsSellBody"),
      formula: t("payoutsSellFormula"),
      ledger: "trade_sell",
    },
    {
      title: t("payoutsResolveTitle"),
      body: t("payoutsResolveBody"),
      formula: t("payoutsResolveFormula"),
      ledger: "market_win",
    },
    {
      title: t("payoutsHouseTitle"),
      body: t("payoutsHouseBody"),
      formula: t("payoutsHouseFormula"),
      ledger: null,
    },
  ] as const

  const examples = [
    {
      title: t("payoutsExample1Title"),
      steps: [
        t("payoutsExample1Step1"),
        t("payoutsExample1Step2"),
        t("payoutsExample1Step3"),
      ],
      result: t("payoutsExample1Result"),
    },
    {
      title: t("payoutsExample2Title"),
      steps: [
        t("payoutsExample2Step1"),
        t("payoutsExample2Step2"),
        t("payoutsExample2Step3"),
      ],
      result: t("payoutsExample2Result"),
    },
    {
      title: t("payoutsExample3Title"),
      steps: [
        t("payoutsExample3Step1"),
        t("payoutsExample3Step2"),
        t("payoutsExample3Step3"),
        t("payoutsExample3Step4"),
      ],
      result: t("payoutsExample3Result"),
    },
  ] as const

  return (
    <div className="mt-6 space-y-8">
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {t("payoutsMechanicsHeading")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mechanics.map((item) => (
            <Card key={item.title} className="bg-card">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{item.title}</CardTitle>
                  {item.ledger ? <LedgerBadge>{item.ledger}</LedgerBadge> : null}
                </div>
                <CardDescription className="text-on-surface-variant">
                  {item.body}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="bg-muted/60 dark:bg-muted/30 rounded-lg px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
                  {item.formula}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t("payoutsExamplesHeading")}
          </h2>
          <p className="text-on-surface-variant max-w-2xl text-sm">
            {t("payoutsExamplesIntro")}
          </p>
        </div>
        <div className="grid gap-4">
          {examples.map((example) => (
            <Card key={example.title} className="bg-card">
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="text-on-surface-variant list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {example.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="border-border border-t pt-3 text-sm font-medium text-foreground">
                  {example.result}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
