import type { Metadata } from "next"
import { PropertyForm } from "@/components/property/property-form"
import { AdBanner } from "@/components/ads/ad-banner"

export const metadata: Metadata = {
  title: "Comprar ou Alugar? — Calculadora Imobiliária",
  description:
    "Compare 4 estratégias financeiras: alugar e investir, financiar e investir, apenas financiar, ou financiar e amortizar.",
}

export default function ImovelPage() {
  return (
    <main className="flex flex-col flex-1 bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <AdBanner slot="top" />
        <PropertyForm />
        <AdBanner slot="bottom" />
      </div>
    </main>
  )
}
