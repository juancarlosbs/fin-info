import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ComparisonResult } from "@/lib/consortium-financing"
import { formatBRL, formatPct } from "@/lib/compound-interest"

interface ComparisonSummaryProps {
  result: ComparisonResult
}

function winnerVariant(label: string) {
  return label === "Empate" ? "secondary" : "default"
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ComparisonSummary({ result }: ComparisonSummaryProps) {
  const differenceHint = result.totalDifference > 0
    ? "Consórcio ficou acima do financiamento"
    : result.totalDifference < 0
      ? "Consórcio ficou abaixo do financiamento"
      : "Custos equivalentes"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo da Comparação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Custo total do consórcio" value={formatBRL(result.consortium.totalCost)} />
          <MetricCard title="Custo total do financiamento" value={formatBRL(result.financing.totalCost)} />
          <MetricCard
            title="Diferença"
            value={`${formatBRL(Math.abs(result.totalDifference))} (${formatPct(Math.abs(result.totalDifferencePct))})`}
            hint={differenceHint}
          />
          <MetricCard title="Menor parcela inicial" value={result.lowestInitialInstallment} />
          <MetricCard title="Dinheiro inicial — consórcio" value={formatBRL(result.consortium.initialCashNeeded)} />
          <MetricCard title="Dinheiro inicial — financiamento" value={formatBRL(result.financing.initialCashNeeded)} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Melhores opções</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={winnerVariant(result.bestByTotalCost)}>Custo total: {result.bestByTotalCost}</Badge>
              <Badge variant="secondary">Urgência: {result.bestForUrgency}</Badge>
              <Badge variant="outline">Pode esperar: {result.bestForWaiting}</Badge>
              {result.breakEvenMonth && <Badge variant="outline">Virada: mês {result.breakEvenMonth}</Badge>}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Comprometimento de renda</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Consórcio 1ª parcela</span><strong className="text-right text-foreground">{formatPct(result.incomeCommitment.consortiumFirstPct)}</strong>
              <span>Consórcio maior parcela</span><strong className="text-right text-foreground">{formatPct(result.incomeCommitment.consortiumMaxPct)}</strong>
              <span>Financiamento 1ª parcela</span><strong className="text-right text-foreground">{formatPct(result.incomeCommitment.financingFirstPct)}</strong>
              <span>Financiamento maior parcela</span><strong className="text-right text-foreground">{formatPct(result.incomeCommitment.financingMaxPct)}</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
