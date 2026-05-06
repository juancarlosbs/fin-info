"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type ComparisonResult } from "@/lib/consortium-financing"
import { formatBRL, formatPct } from "@/lib/compound-interest"

interface ComparisonTableProps {
  result: ComparisonResult
}

function buildCsv(result: ComparisonResult): string {
  const header = [
    "Mês", "Parcela consórcio", "Total pago consórcio", "Diferença vs carta", "% vs carta",
    "Parcela financiamento", "Total pago financiamento", "Saldo devedor", "Diferença vs valor financiado",
    "% vs valor financiado", "Diferença acumulada", "Melhor até o mês",
  ]
  const rows = result.monthlyLines.map((line) => [
    line.month,
    line.consortiumInstallment,
    line.consortiumTotalPaid,
    line.consortiumDifferenceVsCredit,
    line.consortiumDifferencePctVsCredit,
    line.financingInstallment,
    line.financingTotalPaid,
    line.debtBalance,
    line.financingDifferenceVsAmount,
    line.financingDifferencePctVsAmount,
    line.accumulatedDifference,
    line.bestUntilMonth,
  ])
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n")
}

export function ComparisonTable({ result }: ComparisonTableProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const rows = expanded ? result.monthlyLines : result.monthlyLines.slice(0, 12)
  const csv = useMemo(() => buildCsv(result), [result])

  async function copyData() {
    await navigator.clipboard.writeText(csv)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "consortium-financing-comparison.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Tabela mensal</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyData}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar dados"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Exportar CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="max-h-[34rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="text-right">Mês</TableHead>
                <TableHead className="text-right">Parcela consórcio</TableHead>
                <TableHead className="text-right">Total consórcio</TableHead>
                <TableHead className="text-right">Dif. vs carta</TableHead>
                <TableHead className="text-right">% vs carta</TableHead>
                <TableHead className="text-right">Parcela financ.</TableHead>
                <TableHead className="text-right">Total financ.</TableHead>
                <TableHead className="text-right">Saldo devedor</TableHead>
                <TableHead className="text-right">Dif. vs financ.</TableHead>
                <TableHead className="text-right">% vs financ.</TableHead>
                <TableHead className="text-right">Dif. acumulada</TableHead>
                <TableHead>Melhor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((line) => (
                <TableRow
                  key={line.month}
                  className={
                    line.isTurningPoint
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : line.isConsortiumReferenceExceeded || line.isFinancingReferenceExceeded
                        ? "bg-amber-50 dark:bg-amber-950/30"
                        : "odd:bg-muted/30"
                  }
                >
                  <TableCell className="text-right font-medium">{line.month}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.consortiumInstallment)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.consortiumTotalPaid)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.consortiumDifferenceVsCredit)}</TableCell>
                  <TableCell className="text-right">{formatPct(line.consortiumDifferencePctVsCredit)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.financingInstallment)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.financingTotalPaid)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.debtBalance)}</TableCell>
                  <TableCell className="text-right">{formatBRL(line.financingDifferenceVsAmount)}</TableCell>
                  <TableCell className="text-right">{formatPct(line.financingDifferencePctVsAmount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(line.accumulatedDifference)}</TableCell>
                  <TableCell>{line.bestUntilMonth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!expanded && result.monthlyLines.length > 12 && (
          <p className="px-4 pt-3 text-xs text-muted-foreground">Exibindo 12 de {result.monthlyLines.length} meses. Use “Expandir” para ver tudo.</p>
        )}
      </CardContent>
    </Card>
  )
}
