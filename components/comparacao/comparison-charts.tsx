"use client"

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ComparacaoResult, formatBRL } from "@/lib/consortium-financing"

interface Props {
  result: ComparacaoResult
}

// ── axis / tooltip helpers ───────────────────────────────────────────────────

const yFmt = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`
  return `R$${v.toFixed(0)}`
}

function label(month: number, total: number): string {
  if (total <= 24) return `M${month}`
  const year = Math.ceil(month / 12)
  return `A${year}`
}

function groupByYear<T extends { month: number }>(rows: T[]): T[] {
  if (rows.length <= 24) return rows
  const result: T[] = []
  const totalYears = Math.ceil(rows.length / 12)
  for (let y = 1; y <= totalYears; y++) {
    const idx = Math.min(y * 12, rows.length) - 1
    result.push(rows[idx])
  }
  return result
}

function Tooltip1({
  active,
  payload,
  label: lbl,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
      <p className="mb-2 font-semibold">{lbl}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color }} className="flex justify-between gap-4">
          <span>{e.name}:</span>
          <span className="font-medium">{formatBRL(e.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ── chart 1: installment evolution ──────────────────────────────────────────

function InstallmentsChart({ result }: Props) {
  const all = result.rows
  const data = groupByYear(all).map((r) => ({
    label: label(r.month, all.length),
    consorcio: r.consortiumInstallment,
    financiamento: r.financingInstallment,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução das Parcelas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={yFmt} tick={{ fontSize: 11 }} width={68} />
            <Tooltip content={<Tooltip1 />} />
            <Legend wrapperStyle={{ fontSize: 12 }}
              formatter={(v) => (v === "consorcio" ? "Consórcio" : "Financiamento")} />
            <Line
              dataKey="consorcio"
              stroke="hsl(38 92% 50%)"
              strokeWidth={2}
              dot={false}
              name="consorcio"
            />
            <Line
              dataKey="financiamento"
              stroke="hsl(221 83% 53%)"
              strokeWidth={2}
              dot={false}
              name="financiamento"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── chart 2: accumulated paid ────────────────────────────────────────────────

function AccumulatedChart({ result }: Props) {
  const all = result.rows
  const data = groupByYear(all).map((r) => ({
    label: label(r.month, all.length),
    consorcio: r.consortiumCumulativePaid,
    financiamento: r.financingCumulativePaid,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Total Pago Acumulado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={yFmt} tick={{ fontSize: 11 }} width={68} />
            <Tooltip content={<Tooltip1 />} />
            <Legend wrapperStyle={{ fontSize: 12 }}
              formatter={(v) => (v === "consorcio" ? "Consórcio" : "Financiamento")} />
            <Area
              dataKey="consorcio"
              stroke="hsl(38 92% 50%)"
              fill="hsl(38 92% 50% / 0.15)"
              strokeWidth={2}
              name="consorcio"
            />
            <Area
              dataKey="financiamento"
              stroke="hsl(221 83% 53%)"
              fill="hsl(221 83% 53% / 0.15)"
              strokeWidth={2}
              name="financiamento"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── chart 3: accumulated difference ─────────────────────────────────────────

function DiffChart({ result }: Props) {
  const all = result.rows
  const data = groupByYear(all).map((r) => ({
    label: label(r.month, all.length),
    diff: r.accumulatedDiff,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Diferença Acumulada (Financiamento − Consórcio)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Valores positivos = financiamento mais caro; negativos = consórcio mais caro.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={yFmt} tick={{ fontSize: 11 }} width={68} />
            <Tooltip
              content={({ active, payload, label: lbl }) => {
                if (!active || !payload?.length) return null
                const v = payload[0].value as number
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
                    <p className="mb-1 font-semibold">{lbl}</p>
                    <p style={{ color: v >= 0 ? "hsl(221 83% 53%)" : "hsl(38 92% 50%)" }}>
                      {formatBRL(v)}
                    </p>
                  </div>
                )
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
            <Bar dataKey="diff" name="Diferença" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.diff >= 0 ? "hsl(221 83% 53%)" : "hsl(38 92% 50%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── chart 4: cost composition ────────────────────────────────────────────────

function CompositionChart({ result }: Props) {
  const { consortium, financing } = result

  const data = [
    {
      name: "Consórcio",
      "Fundo comum": consortium.totalInstallmentsPaid - consortium.totalAdminFee - consortium.totalReserveFund - consortium.totalInsurance,
      "Taxa admin": consortium.totalAdminFee,
      "Fundo reserva": consortium.totalReserveFund,
      "Seguros": consortium.totalInsurance,
      "Extras/Lance": consortium.totalExtraCosts,
    },
    {
      name: "Financiamento",
      "Entrada": financing.downPayment,
      "Juros": financing.totalInterest,
      "Seguros": financing.totalInsurance,
      "IOF": financing.totalIOF,
      "Taxas/Extras": financing.totalFees,
    },
  ]

  const consortiumKeys = [
    { key: "Fundo comum", color: "hsl(38 92% 50%)" },
    { key: "Taxa admin", color: "hsl(38 72% 40%)" },
    { key: "Fundo reserva", color: "hsl(38 62% 55%)" },
    { key: "Seguros", color: "hsl(142 71% 45%)" },
    { key: "Extras/Lance", color: "hsl(0 84% 60%)" },
    { key: "Entrada", color: "hsl(221 83% 53%)" },
    { key: "Juros", color: "hsl(201 83% 53%)" },
    { key: "IOF", color: "hsl(261 83% 63%)" },
    { key: "Taxas/Extras", color: "hsl(330 80% 60%)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Composição do Custo Final</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={yFmt} tick={{ fontSize: 11 }} width={68} />
            <Tooltip
              content={({ active, payload, label: lbl }) => {
                if (!active || !payload?.length) return null
                type Entry = { name: string; value: number; color: string }
                const entries = (payload as unknown as Entry[])
                const total = entries.reduce((s, e) => s + (e.value || 0), 0)
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
                    <p className="mb-2 font-semibold">{lbl}</p>
                    {entries.map((e) =>
                      e.value > 0 ? (
                        <p key={e.name} style={{ color: e.color }} className="flex justify-between gap-4">
                          <span>{e.name}:</span>
                          <span className="font-medium">{formatBRL(e.value)}</span>
                        </p>
                      ) : null
                    )}
                    <p className="mt-2 border-t pt-2 font-semibold flex justify-between gap-4">
                      <span>Total:</span>
                      <span>{formatBRL(total)}</span>
                    </p>
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {consortiumKeys.map(({ key, color }) => (
              <Bar key={key} dataKey={key} stackId="a" fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── chart 5: financing balance ───────────────────────────────────────────────

function BalanceChart({ result }: Props) {
  const all = result.rows
  const data = groupByYear(all).map((r) => ({
    label: label(r.month, all.length),
    saldo: r.financingBalance,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saldo Devedor — Financiamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={yFmt} tick={{ fontSize: 11 }} width={68} />
            <Tooltip
              content={({ active, payload, label: lbl }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
                    <p className="mb-1 font-semibold">{lbl}</p>
                    <p className="text-blue-600">{formatBRL((payload[0].value as number) ?? 0)}</p>
                  </div>
                )
              }}
            />
            <Area
              dataKey="saldo"
              stroke="hsl(221 83% 53%)"
              fill="hsl(221 83% 53% / 0.15)"
              strokeWidth={2}
              name="Saldo devedor"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── main export ──────────────────────────────────────────────────────────────

export function ComparisonCharts({ result }: Props) {
  return (
    <div className="space-y-6">
      <InstallmentsChart result={result} />
      <AccumulatedChart result={result} />
      <DiffChart result={result} />
      <CompositionChart result={result} />
      <BalanceChart result={result} />
    </div>
  )
}
