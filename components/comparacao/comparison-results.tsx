"use client"

import { useState } from "react"
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Trophy,
  Clock,
  Zap,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type ComparacaoResult, formatBRL, formatPct } from "@/lib/consortium-financing"

interface Props {
  result: ComparacaoResult
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">
        {value}
        {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
      </span>
    </div>
  )
}

function WinnerBadge({ winner, label }: { winner: string; label: string }) {
  const isConsorcio = winner === "Consórcio"
  const isEmpate = winner === "Empate"
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge
        className={
          isEmpate
            ? "bg-muted text-muted-foreground"
            : isConsorcio
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0"
        }
      >
        {winner}
      </Badge>
    </div>
  )
}

export function ComparisonResults({ result }: Props) {
  const [copied, setCopied] = useState(false)
  const { consortium, financing, totalCostDiff, betterTotalCost, betterFirstInstallment,
          consortiumInitialCash, financingInitialCash, consortiumIncomePercent,
          financingIncomePercent, breakEvenMonth, conclusion, alerts } = result

  const betterForUrgency = "Financiamento"
  const betterForWaiting = betterTotalCost === "Consórcio" ? "Consórcio"
    : betterTotalCost === "Financiamento" ? "Financiamento" : "Empate"

  async function handleCopy() {
    const text = buildTextSummary(result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* ── Summary cards ──────────────────────────────────── */}

      {/* Row 1: top 3 highlight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          className={
            betterTotalCost === "Consórcio"
              ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20"
              : betterTotalCost === "Financiamento"
              ? "border-primary/20 bg-primary text-primary-foreground"
              : "border-muted"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium opacity-80">
              <Trophy className="size-4" />
              Melhor custo total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{betterTotalCost}</p>
            <p className="mt-1 text-xs opacity-70">
              {Math.abs(totalCostDiff) < 1
                ? "Custos praticamente iguais"
                : `${formatBRL(Math.abs(totalCostDiff))} mais barato`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="size-4" />
              Custo total — Consórcio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatBRL(consortium.totalCost)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              +{formatPct(consortium.percentAboveCredit)} acima da carta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Custo total — Financiamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatBRL(financing.totalCost)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              +{formatPct(financing.percentAboveFinanced)} acima do financiado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 4 metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Diferença total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatBRL(Math.abs(totalCostDiff))}</p>
            <p className="text-xs text-muted-foreground">
              {totalCostDiff > 0 ? "Financiamento mais caro" : totalCostDiff < 0 ? "Consórcio mais caro" : "Empate"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Parcela inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">C: {formatBRL(consortium.firstInstallment)}</p>
            <p className="text-sm font-bold">F: {formatBRL(financing.firstInstallment)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Dinheiro inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">C: {formatBRL(consortiumInitialCash)}</p>
            <p className="text-sm font-bold">F: {formatBRL(financingInitialCash)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">% renda (1ª parcela)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold">C: {formatPct(consortiumIncomePercent)}</p>
            <p className="text-sm font-bold">F: {formatPct(financingIncomePercent)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: classification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Qual opção se destaca em cada cenário?</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <WinnerBadge winner={betterTotalCost} label="Menor custo total" />
          <WinnerBadge winner={betterFirstInstallment} label="Menor parcela inicial" />
          <WinnerBadge winner={betterForUrgency} label="Para quem precisa do bem agora" />
          <WinnerBadge winner={betterForWaiting} label="Para quem pode esperar" />
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-xs text-muted-foreground">Ponto de equilíbrio</span>
            <Badge className="bg-muted text-muted-foreground border-0">
              {breakEvenMonth !== null ? `Mês ${breakEvenMonth}` : "Não ocorre no período"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              Alertas da simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex gap-2 text-sm">
                {alert.type === "warning" ? (
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />
                )}
                <span className="text-muted-foreground">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Conclusion ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="size-4" />
            Conclusão automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {conclusion}
          </p>
        </CardContent>
      </Card>

      {/* ── Detailed breakdowns ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Consortium breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="size-4" />
              Detalhamento — Consórcio
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            <StatRow label="Parcela inicial estimada" value={formatBRL(consortium.firstInstallment)} />
            <StatRow label="Parcela final estimada" value={formatBRL(consortium.lastInstallment)} />
            <StatRow label="Total pago em parcelas" value={formatBRL(consortium.totalInstallmentsPaid)} />
            <StatRow label="Total em taxa de administração" value={formatBRL(consortium.totalAdminFee)} />
            <StatRow label="Total em fundo de reserva" value={formatBRL(consortium.totalReserveFund)} />
            <StatRow label="Total em seguros" value={formatBRL(consortium.totalInsurance)} />
            <StatRow label="Custos extras" value={formatBRL(consortium.totalExtraCosts)} />
            <StatRow label="Crédito líquido" value={formatBRL(consortium.liquidCredit)}
              sub="Carta − lance embutido" />
            {consortium.complement > 0 && (
              <StatRow label="Complemento necessário"
                value={formatBRL(consortium.complement)} />
            )}
            <StatRow label="Custo total estimado" value={formatBRL(consortium.totalCost)} />
            <StatRow label="% acima da carta" value={formatPct(consortium.percentAboveCredit)} />
            <StatRow label="Mês estimado de uso" value={`Mês ${consortium.estimatedUseMonth}`} />
          </CardContent>
        </Card>

        {/* Financing breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="size-4" />
              Detalhamento — Financiamento
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            <StatRow label="Entrada" value={formatBRL(financing.downPayment)} />
            <StatRow label="Valor financiado" value={formatBRL(financing.financedValue)} />
            <StatRow label="Parcela inicial" value={formatBRL(financing.firstInstallment)} />
            <StatRow label="Parcela final estimada" value={formatBRL(financing.lastInstallment)} />
            <StatRow label="Total pago em parcelas" value={formatBRL(financing.totalInstallmentsPaid)} />
            <StatRow label="Total em juros" value={formatBRL(financing.totalInterest)} />
            <StatRow label="Total em seguros" value={formatBRL(financing.totalInsurance)} />
            <StatRow label="IOF" value={formatBRL(financing.totalIOF)} />
            <StatRow label="Tarifas e custos extras" value={formatBRL(financing.totalFees)} />
            <StatRow label="Custo total estimado" value={formatBRL(financing.totalCost)} />
            <StatRow label="% acima do financiado" value={formatPct(financing.percentAboveFinanced)} />
            <StatRow label="Disponibilidade do bem"
              value="Imediata" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ── Text summary ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            Resumo para copiar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed rounded-md bg-muted/50 p-3">
            {buildTextSummary(result)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado!" : "Copiar resumo"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Esta simulação é apenas uma estimativa e não substitui proposta oficial de banco,
            administradora de consórcio, contrato, corretor, cartório ou análise financeira profissional.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function buildTextSummary(result: ComparacaoResult): string {
  const { consortium, financing, betterTotalCost, breakEvenMonth } = result
  const lines: string[] = [
    `=== COMPARAÇÃO: CONSÓRCIO VS FINANCIAMENTO ===`,
    ``,
    `CONSÓRCIO`,
    `  Carta de crédito:      ${formatBRL(consortium.liquidCredit + (result.financing.downPayment ?? 0))}`,
    `  Parcela inicial:       ${formatBRL(consortium.firstInstallment)}`,
    `  Parcela final:         ${formatBRL(consortium.lastInstallment)}`,
    `  Custo total estimado:  ${formatBRL(consortium.totalCost)}`,
    `  % acima da carta:      ${formatPct(consortium.percentAboveCredit)}`,
    `  Mês estimado de uso:   Mês ${consortium.estimatedUseMonth}`,
    ``,
    `FINANCIAMENTO`,
    `  Entrada:               ${formatBRL(financing.downPayment)}`,
    `  Valor financiado:      ${formatBRL(financing.financedValue)}`,
    `  Parcela inicial:       ${formatBRL(financing.firstInstallment)}`,
    `  Parcela final:         ${formatBRL(financing.lastInstallment)}`,
    `  Total em juros:        ${formatBRL(financing.totalInterest)}`,
    `  Custo total estimado:  ${formatBRL(financing.totalCost)}`,
    `  % acima do financiado: ${formatPct(financing.percentAboveFinanced)}`,
    `  Disponibilidade:       Imediata`,
    ``,
    `COMPARAÇÃO`,
    `  Melhor custo total:    ${betterTotalCost}`,
    `  Diferença:             ${formatBRL(Math.abs(result.totalCostDiff))}`,
    breakEvenMonth
      ? `  Ponto de equilíbrio:   Mês ${breakEvenMonth}`
      : `  Ponto de equilíbrio:   Não ocorre no período`,
    ``,
    `CONCLUSÃO`,
    result.conclusion,
    ``,
    `* Esta simulação é uma estimativa. Não substitui proposta oficial.`,
  ]
  return lines.join("\n")
}
