import type { Metadata } from "next"
import { TickerSearch } from "@/components/acoes/ticker-search"
import { AdBanner } from "@/components/ads/ad-banner"

export const metadata: Metadata = {
  title: "Análise de Ações — Graham e Bazin",
  description:
    "Calcule o preço justo de ações da B3 pelas fórmulas de Graham e Bazin. Veja a classificação de viabilidade com análise de fundamentos.",
}

export default function AcoesPage() {
  return (
    <main className="flex flex-col flex-1 bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <AdBanner slot="top" />
        <TickerSearch />
        <AdBanner slot="bottom" />
      </div>
    </main>
  )
}
