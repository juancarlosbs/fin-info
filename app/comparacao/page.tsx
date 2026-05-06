import type { Metadata } from "next"
import { ComparacaoForm } from "@/components/comparacao/comparacao-form"
import { AdBanner } from "@/components/ads/ad-banner"

export const metadata: Metadata = {
  title: "Consórcio vs Financiamento",
  description:
    "Compare o custo total de consórcio e financiamento parcela por parcela e descubra qual opção é mais vantajosa para você.",
}

export default function ComparacaoPage() {
  return (
    <main className="flex flex-col flex-1 bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <AdBanner slot="top" />
        <ComparacaoForm />
        <AdBanner slot="bottom" />
      </div>
    </main>
  )
}
