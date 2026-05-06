"use client"

import { useState } from "react"
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
import { formatBRL } from "@/lib/compound-interest"
import { type MonthlySnap } from "@/lib/property-calculator"

interface ScenarioTableProps {
  breakdown: MonthlySnap[]
}

type ScenarioKey = "rentInvest" | "financeInvest" | "financeOnly" | "financeAmortize"

const SCENARIO_TABS: Array<{ key: ScenarioKey; label: string; colorClass: string }> = [
  { key: "rentInvest", label: "Alugar + Investir", colorClass: "text-blue-600 dark:text-blue-400" },
  { key: "financeInvest", label: "Financiar + Investir", colorClass: "text-green-600 dark:text-green-400" },
  { key: "financeOnly", label: "Apenas Financiar", colorClass: "text-amber-600 dark:text-amber-400" },
  { key: "financeAmortize", label: "Financiar + Amortizar", colorClass: "text-purple-600 dark:text-purple-400" },
]

export function ScenarioTable({ breakdown }: ScenarioTableProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("rentInvest")
  const activeTab = SCENARIO_TABS.find((tab) => tab.key === activeScenario) ?? SCENARIO_TABS[0]

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-base">Detalhamento dos Cenários Mês a Mês</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Navegue pelas abas para ver parcela, juros, amortização, aluguel corrigido,
            investimentos, dívida e patrimônio de cada estratégia.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Cenários imobiliários">
          {SCENARIO_TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={activeScenario === tab.key ? "default" : "outline"}
              className="shrink-0"
              role="tab"
              aria-selected={activeScenario === tab.key}
              onClick={() => setActiveScenario(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="max-h-96 overflow-y-auto">
          {activeScenario === "rentInvest" && <RentInvestTable breakdown={breakdown} colorClass={activeTab.colorClass} />}
          {activeScenario === "financeInvest" && <FinanceInvestTable breakdown={breakdown} colorClass={activeTab.colorClass} />}
          {activeScenario === "financeOnly" && <FinanceOnlyTable breakdown={breakdown} colorClass={activeTab.colorClass} />}
          {activeScenario === "financeAmortize" && <FinanceAmortizeTable breakdown={breakdown} colorClass={activeTab.colorClass} />}
        </div>
      </CardContent>
    </Card>
  )
}

function RentInvestTable({ breakdown, colorClass }: { breakdown: MonthlySnap[]; colorClass: string }) {
  return (
    <Table className="min-w-[760px]">
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          <TableHead className="text-right">Mês</TableHead>
          <TableHead className="text-right">Aluguel corrigido</TableHead>
          <TableHead className="text-right">Investido no mês</TableHead>
          <TableHead className="text-right">Carteira acumulada</TableHead>
          <TableHead className="text-right">Total desembolsado</TableHead>
          <TableHead className="text-right">Patrimônio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.map((row) => (
          <TableRow key={row.month} className="odd:bg-muted/30">
            <TableCell className="text-right font-medium">{row.month}</TableCell>
            <TableCell className="text-right">{formatBRL(row.rentInvestDetails.correctedRent)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.rentInvestDetails.monthlyInvestment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.rentInvestDetails.portfolio)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.rentInvestDetails.totalPaid)}</TableCell>
            <TableCell className={`text-right font-semibold ${colorClass}`}>{formatBRL(row.rentInvest)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FinanceInvestTable({ breakdown, colorClass }: { breakdown: MonthlySnap[]; colorClass: string }) {
  return (
    <Table className="min-w-[980px]">
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          <TableHead className="text-right">Mês</TableHead>
          <TableHead className="text-right">Parcela</TableHead>
          <TableHead className="text-right">Juros</TableHead>
          <TableHead className="text-right">Amortização</TableHead>
          <TableHead className="text-right">Investido no mês</TableHead>
          <TableHead className="text-right">Valor do imóvel</TableHead>
          <TableHead className="text-right">Dívida</TableHead>
          <TableHead className="text-right">Carteira</TableHead>
          <TableHead className="text-right">Patrimônio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.map((row) => (
          <TableRow key={row.month} className="odd:bg-muted/30">
            <TableCell className="text-right font-medium">{row.month}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.payment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.interest)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.principal)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.monthlyInvestment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.propertyValue)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.remainingDebt)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeInvestDetails.portfolio)}</TableCell>
            <TableCell className={`text-right font-semibold ${colorClass}`}>{formatBRL(row.financeInvest)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FinanceOnlyTable({ breakdown, colorClass }: { breakdown: MonthlySnap[]; colorClass: string }) {
  return (
    <Table className="min-w-[820px]">
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          <TableHead className="text-right">Mês</TableHead>
          <TableHead className="text-right">Parcela</TableHead>
          <TableHead className="text-right">Juros</TableHead>
          <TableHead className="text-right">Amortização</TableHead>
          <TableHead className="text-right">Valor do imóvel</TableHead>
          <TableHead className="text-right">Dívida</TableHead>
          <TableHead className="text-right">Total desembolsado</TableHead>
          <TableHead className="text-right">Patrimônio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.map((row) => (
          <TableRow key={row.month} className="odd:bg-muted/30">
            <TableCell className="text-right font-medium">{row.month}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.payment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.interest)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.principal)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.propertyValue)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.remainingDebt)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeOnlyDetails.totalPaid)}</TableCell>
            <TableCell className={`text-right font-semibold ${colorClass}`}>{formatBRL(row.financeOnly)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FinanceAmortizeTable({ breakdown, colorClass }: { breakdown: MonthlySnap[]; colorClass: string }) {
  return (
    <Table className="min-w-[1120px]">
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          <TableHead className="text-right">Mês</TableHead>
          <TableHead className="text-right">Parcela regular</TableHead>
          <TableHead className="text-right">Juros</TableHead>
          <TableHead className="text-right">Amortização SAC</TableHead>
          <TableHead className="text-right">Amortização extra</TableHead>
          <TableHead className="text-right">Sobra investida</TableHead>
          <TableHead className="text-right">Valor do imóvel</TableHead>
          <TableHead className="text-right">Dívida</TableHead>
          <TableHead className="text-right">Carteira</TableHead>
          <TableHead className="text-right">Status</TableHead>
          <TableHead className="text-right">Patrimônio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {breakdown.map((row) => (
          <TableRow key={row.month} className="odd:bg-muted/30">
            <TableCell className="text-right font-medium">{row.month}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.regularPayment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.interest)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.scheduledPrincipal)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.extraAmortization)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.monthlyInvestment)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.propertyValue)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.remainingDebt)}</TableCell>
            <TableCell className="text-right">{formatBRL(row.financeAmortizeDetails.portfolio)}</TableCell>
            <TableCell className="text-right">{row.financeAmortizeDetails.paidOff ? "Quitado" : "Em aberto"}</TableCell>
            <TableCell className={`text-right font-semibold ${colorClass}`}>{formatBRL(row.financeAmortize)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
