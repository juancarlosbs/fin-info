"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ComparisonResult } from "@/lib/consortium-financing"
import { formatBRL } from "@/lib/compound-interest"

interface ComparisonChartsProps {
  result: ComparisonResult
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

const yAxisFormatter = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`
  return `R$${value}`
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 text-sm shadow-md">
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}:</span>
          <span className="font-medium">{formatBRL(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

function buildMonthlyData(result: ComparisonResult) {
  const step = result.monthlyLines.length > 120 ? 6 : result.monthlyLines.length > 60 ? 3 : 1
  return result.monthlyLines
    .filter((line) => line.month === 1 || line.month === result.monthlyLines.length || line.month % step === 0)
    .map((line) => ({
      label: `M${line.month}`,
      consorcioParcela: line.consortiumInstallment,
      financiamentoParcela: line.financingInstallment,
      consorcioTotal: line.consortiumTotalPaid,
      financiamentoTotal: line.financingTotalPaid,
      diferenca: line.accumulatedDifference,
      saldo: line.debtBalance,
    }))
}

export function ComparisonCharts({ result }: ComparisonChartsProps) {
  const data = buildMonthlyData(result)
  const composition = [
    ...result.consortium.costComposition.map((item) => ({ grupo: "Consórcio", componente: item.label, valor: item.value })),
    ...result.financing.costComposition.map((item) => ({ grupo: "Financiamento", componente: item.label, valor: item.value })),
  ]

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Evolução das parcelas</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11 }} width={68} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="consorcioParcela" name="Parcela consórcio" stroke="hsl(221 83% 53%)" dot={false} />
              <Line type="monotone" dataKey="financiamentoParcela" name="Parcela financiamento" stroke="hsl(142 71% 45%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Total pago acumulado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11 }} width={68} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="consorcioTotal" name="Consórcio" stroke="hsl(221 83% 53%)" fill="hsl(221 83% 53% / 0.2)" />
              <Area type="monotone" dataKey="financiamentoTotal" name="Financiamento" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Diferença acumulada</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11 }} width={68} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="diferenca" name="Consórcio - financiamento" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Saldo devedor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11 }} width={68} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="saldo" name="Saldo devedor" stroke="hsl(0 84% 60%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Composição do custo final</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={composition} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="componente" tick={{ fontSize: 10 }} interval={0} angle={-20} height={70} />
              <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11 }} width={68} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="valor" name="Valor" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
