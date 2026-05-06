import type { Metadata } from "next"
import { CalculatorForm } from "@/components/calculator/calculator-form"
import { AdBanner } from "@/components/ads/ad-banner"

export const metadata: Metadata = {
  title: "Calculadora de Juros Compostos",
  description:
    "Simule o crescimento do seu investimento com aportes mensais e veja a evolução mês a mês.",
}

export default function Home() {
  return (
    <main className="flex flex-col flex-1 bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6">
        <AdBanner slot="top" />
        <CalculatorForm />
        <AdBanner slot="bottom" />
      </div>
    </main>
  )
}
