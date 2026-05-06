"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type CalculationResult, formatBRL } from "@/lib/compound-interest"

interface GrowthChartProps {
  result: CalculationResult
}

interface ChartDataPoint {
  label: string
  invested: number
  interest: number
}

function buildChartData(result: CalculationResult): ChartDataPoint[] {
  const { breakdown } = result
  const totalMonths = breakdown.length

  if (totalMonths <= 24) {
    return breakdown.map((entry) => ({
      label: `M${entry.month}`,
      invested: Math.round(entry.totalInvested * 100) / 100,
      interest: Math.round(entry.totalInterest * 100) / 100,
    }))
  }

  // Group by year for longer periods
  const yearlyData: ChartDataPoint[] = []
  const totalYears = Math.ceil(totalMonths / 12)
  for (let year = 1; year <= totalYears; year++) {
    const monthIndex = Math.min(year * 12, totalMonths) - 1
    const entry = breakdown[monthIndex]
    yearlyData.push({
      label: `Ano ${year}`,
      invested: Math.round(entry.totalInvested * 100) / 100,
      interest: Math.round(entry.totalInterest * 100) / 100,
    })
  }
  return yearlyData
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, entry) => sum + entry.value, 0)
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}:</span>
          <span className="font-medium">{formatBRL(entry.value)}</span>
        </p>
      ))}
      <p className="mt-2 border-t pt-2 font-semibold flex justify-between gap-4">
        <span>Total:</span>
        <span>{formatBRL(total)}</span>
      </p>
    </div>
  )
}

const yAxisFormatter = (value: number): string => {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`
  return `R$${value}`
}

export function GrowthChart({ result }: GrowthChartProps) {
  const data = buildChartData(result)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução do Patrimônio</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
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
              width={68}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) =>
                value === "invested" ? "Valor Investido" : "Juros"
              }
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="invested" name="invested" stackId="a" fill="hsl(221 83% 53%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="interest" name="interest" stackId="a" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
