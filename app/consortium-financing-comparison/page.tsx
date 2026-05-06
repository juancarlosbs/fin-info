import type { Metadata } from "next"
import { AdBanner } from "@/components/ads/ad-banner"
import { ComparisonForm } from "@/components/consortium-financing/comparison-form"

export const metadata: Metadata = {
  title: "Comparação Consórcio x Financiamento",
  description:
    "Compare custos estimados de consórcio e financiamento com parcelas, saldo devedor, lances, reajustes e alertas automáticos.",
}

export default function ConsortiumFinancingComparisonPage() {
  return (
    <main className="flex flex-col flex-1 bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <AdBanner slot="top" />
        <ComparisonForm />
        <AdBanner slot="bottom" />
      </div>
    </main>
  )
}
