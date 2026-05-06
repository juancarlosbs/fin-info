"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type ComparisonRow, formatBRL, formatPct } from "@/lib/consortium-financing"

interface Props {
  rows: ComparisonRow[]
  creditValue: number
  financedValue: number
  breakEvenMonth: number | null
}

function exportCSV(rows: ComparisonRow[], creditValue: number, financedValue: number) {
  const header = [
    "Mês",
    "Parcela Consórcio",
    "Total Pago Consórcio",
    "Diferença vs Carta",
    "Diferença % vs Carta",
    "Parcela Financiamento",
    "Total Pago Financiamento",
    "Saldo Devedor",
    "Diferença vs Financiado",
    "Diferença % vs Financiado",
    "Diferença Acumulada",
    "Melhor até o mês",
  ]

  const fmt = (n: number) => n.toFixed(2).replace(".", ",")

  const lines = rows.map((r) =>
    [
      r.month,
      fmt(r.consortiumInstallment),
      fmt(r.consortiumCumulativePaid),
      fmt(r.consortiumDiffVsCredit),
      fmt(r.consortiumDiffPctVsCredit),
      fmt(r.financingInstallment),
      fmt(r.financingCumulativePaid),
      fmt(r.financingBalance),
      fmt(r.financingDiffVsFinanced),
      fmt(r.financingDiffPctVsFinanced),
      fmt(r.accumulatedDiff),
      r.better,
    ].join(";")
  )

  const csv = [header.join(";"), ...lines].join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "comparacao-consorcio-financiamento.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// Find the first month where the consortium cumulative exceeds the credit value
function findConsortiumCrossMonth(rows: ComparisonRow[], creditValue: number): number | null {
  for (const r of rows) {
    if (r.consortiumCumulativePaid > creditValue) return r.month
  }
  return null
}

function findFinancingCrossMonth(rows: ComparisonRow[], financedValue: number): number | null {
  for (const r of rows) {
    if (r.financingCumulativePaid > financedValue) return r.month
  }
  return null
}

export function ComparisonTable({ rows, creditValue, financedValue, breakEvenMonth }: Props) {
  const [expanded, setExpanded] = useState(false)
  const PREVIEW_ROWS = 12

  const consortiumCrossMonth = findConsortiumCrossMonth(rows, creditValue)
  const financingCrossMonth = findFinancingCrossMonth(rows, financedValue)

  const displayRows = expanded ? rows : rows.slice(0, PREVIEW_ROWS)

  function rowClass(row: ComparisonRow): string {
    if (breakEvenMonth !== null && row.month === breakEvenMonth)
      return "bg-blue-50 dark:bg-blue-950/20"
    if (consortiumCrossMonth !== null && row.month === consortiumCrossMonth)
      return "bg-amber-50 dark:bg-amber-950/20"
    return "odd:bg-muted/30"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Tabela Comparativa — Mês a Mês</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => exportCSV(rows, creditValue, financedValue)}
            >
              <Download className="size-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" />
                  Ver todos ({rows.length} meses)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
          {breakEvenMonth !== null && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-blue-200 dark:bg-blue-800" />
              Mês {breakEvenMonth}: ponto de equilíbrio
            </span>
          )}
          {consortiumCrossMonth !== null && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-amber-200 dark:bg-amber-800" />
              Mês {consortiumCrossMonth}: consórcio ultrapassa valor da carta
            </span>
          )}
          {financingCrossMonth !== null && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Financiamento ultrapassa valor financiado no mês {financingCrossMonth}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        <div className={expanded ? "overflow-x-auto overflow-y-auto max-h-[560px]" : "overflow-x-auto"}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-right whitespace-nowrap">Mês</TableHead>
                <TableHead className="text-right whitespace-nowrap">Parcela Consórcio</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total Pago C.</TableHead>
                <TableHead className="text-right whitespace-nowrap">Dif. vs Carta</TableHead>
                <TableHead className="text-right whitespace-nowrap">Dif. % vs Carta</TableHead>
                <TableHead className="text-right whitespace-nowrap">Parcela Financ.</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total Pago F.</TableHead>
                <TableHead className="text-right whitespace-nowrap">Saldo Devedor</TableHead>
                <TableHead className="text-right whitespace-nowrap">Dif. vs Financiado</TableHead>
                <TableHead className="text-right whitespace-nowrap">Dif. % vs Financiado</TableHead>
                <TableHead className="text-right whitespace-nowrap">Dif. Acumulada</TableHead>
                <TableHead className="text-center whitespace-nowrap">Melhor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => (
                <TableRow key={row.month} className={rowClass(row)}>
                  <TableCell className="text-right font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.consortiumInstallment)}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.consortiumCumulativePaid)}</TableCell>
                  <TableCell
                    className={
                      "text-right " +
                      (row.consortiumDiffVsCredit > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400")
                    }
                  >
                    {row.consortiumDiffVsCredit > 0 ? "+" : ""}
                    {formatBRL(row.consortiumDiffVsCredit)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right " +
                      (row.consortiumDiffPctVsCredit > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400")
                    }
                  >
                    {row.consortiumDiffPctVsCredit > 0 ? "+" : ""}
                    {formatPct(row.consortiumDiffPctVsCredit)}
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(row.financingInstallment)}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.financingCumulativePaid)}</TableCell>
                  <TableCell className="text-right text-blue-600 dark:text-blue-400">
                    {formatBRL(row.financingBalance)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right " +
                      (row.financingDiffVsFinanced > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400")
                    }
                  >
                    {row.financingDiffVsFinanced > 0 ? "+" : ""}
                    {formatBRL(row.financingDiffVsFinanced)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right " +
                      (row.financingDiffPctVsFinanced > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400")
                    }
                  >
                    {row.financingDiffPctVsFinanced > 0 ? "+" : ""}
                    {formatPct(row.financingDiffPctVsFinanced)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right font-medium " +
                      (row.accumulatedDiff > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : row.accumulatedDiff < 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "")
                    }
                  >
                    {row.accumulatedDiff > 0 ? "+" : ""}
                    {formatBRL(row.accumulatedDiff)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        row.better === "Consórcio"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs"
                          : row.better === "Financiamento"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-xs"
                          : "bg-muted text-muted-foreground border-0 text-xs"
                      }
                    >
                      {row.better === "Consórcio" ? "C" : row.better === "Financiamento" ? "F" : "="}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!expanded && rows.length > PREVIEW_ROWS && (
          <div className="px-4 py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="size-4" />
              Mostrar {rows.length - PREVIEW_ROWS} meses restantes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
