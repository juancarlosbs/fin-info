"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ComparisonResult } from "@/lib/consortium-financing"
import { formatBRL, formatPct } from "@/lib/compound-interest"

interface CopyableFinalSummaryProps {
  result: ComparisonResult
}

export function CopyableFinalSummary({ result }: CopyableFinalSummaryProps) {
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => [
    "Comparação Consórcio x Financiamento",
    `Custo total do consórcio: ${formatBRL(result.consortium.totalCost)}`,
    `Custo total do financiamento: ${formatBRL(result.financing.totalCost)}`,
    `Diferença: ${formatBRL(result.totalDifference)} (${formatPct(result.totalDifferencePct)})`,
    `Melhor por custo total: ${result.bestByTotalCost}`,
    `Menor parcela inicial: ${result.lowestInitialInstallment}`,
    `Melhor para urgência: ${result.bestForUrgency}`,
    `Melhor para quem pode esperar: ${result.bestForWaiting}`,
    result.breakEvenMonth ? `Ponto de virada: mês ${result.breakEvenMonth}` : "Ponto de virada: não identificado",
    "Simulação estimativa; não substitui proposta oficial ou análise profissional.",
  ].join("\n"), [result])

  async function copySummary() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Resumo final copiável</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={copySummary}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar resumo"}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs text-muted-foreground">{text}</pre>
      </CardContent>
    </Card>
  )
}
