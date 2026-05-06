"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type MonthlySnap } from "@/lib/property-calculator"
import { formatBRL } from "@/lib/compound-interest"

interface ScenarioChartProps {
  breakdown: MonthlySnap[]
  totalMonths: number
}

interface ChartPoint {
  label: string
  rentInvest: number
  financeInvest: number
  financeOnly: number
  financeAmortize: number
}

function buildChartData(breakdown: MonthlySnap[], totalMonths: number): ChartPoint[] {
  const totalYears = Math.ceil(totalMonths / 12)
  return Array.from({ length: totalYears }, (_, i) => {
    const year = i + 1
    const idx = Math.min(year * 12, totalMonths) - 1
    const snap = breakdown[idx]
    return {
      label: `Ano ${year}`,
      rentInvest: Math.round(snap.rentInvest),
      financeInvest: Math.round(snap.financeInvest),
      financeOnly: Math.round(snap.financeOnly),
      financeAmortize: Math.round(snap.financeAmortize),
    }
  })
}

const LINES = [
  { key: "rentInvest", label: "Alugar + Investir", color: "hsl(221 83% 53%)" },
  { key: "financeInvest", label: "Financiar + Investir", color: "hsl(142 71% 45%)" },
  { key: "financeOnly", label: "Apenas Financiar", color: "hsl(38 92% 50%)" },
  { key: "financeAmortize", label: "Financiar + Amortizar", color: "hsl(280 65% 60%)" },
] as const

const yAxisFormatter = (value: number): string => {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`
  return `R$${value}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) => b.value - a.value)
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-[220px]">
      <p className="mb-2 font-semibold">{label}</p>
      {sorted.map((entry) => (
        <p
          key={entry.dataKey}
          className="flex justify-between gap-4"
          style={{ color: entry.color }}
        >
          <span className="truncate">{entry.name}:</span>
          <span className="font-medium tabular-nums">{formatBRL(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function ScenarioChart({ breakdown, totalMonths }: ScenarioChartProps) {
  const data = buildChartData(breakdown, totalMonths)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução do Patrimônio por Cenário</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {LINES.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
