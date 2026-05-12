"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StockHeader } from "@/components/acoes/stock-header"
import { GrahamCard } from "@/components/acoes/graham-card"
import { BazinCard } from "@/components/acoes/bazin-card"
import { DDMCard } from "@/components/acoes/ddm-card"
import { DCFCard } from "@/components/acoes/dcf-card"
import { LynchCard } from "@/components/acoes/lynch-card"
import { BuffettCard } from "@/components/acoes/buffett-card"
import { AveragePriceCard } from "@/components/acoes/average-price-card"
import { ViabilityCard } from "@/components/acoes/viability-card"
import {
  type StockData,
  calculateGrahamPrice,
  calculateBazinPrice,
  calculateDDMPrice,
  calculateDCFPrice,
  calculateLynchPrice,
  calculateBuffettPrice,
  calculateAveragePrice,
  classifyViability,
} from "@/lib/graham-bazin"

export function TickerSearch() {
  const [ticker, setTicker] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StockData | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = ticker.trim().toUpperCase()
    if (!cleaned) return

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(`/api/acoes?ticker=${cleaned}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "Erro ao buscar dados")
        return
      }

      setData(json as StockData)
    } catch {
      setError("Falha de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const grahamResult = data ? calculateGrahamPrice(data.eps, data.bookValue) : null
  const bazinResult = data ? calculateBazinPrice(data.dividends) : null
  const ddmResult = data ? calculateDDMPrice(data.dividends) : null
  const dcfResult = data
    ? calculateDCFPrice(
        data.freeCashflow,
        data.sharesOutstanding,
        data.beta,
        data.marketCap,
        data.totalDebt,
        data.earningsGrowth
      )
    : null
  const lynchResult = data ? calculateLynchPrice(data.eps, data.earningsGrowth) : null
  const buffettResult = data
    ? calculateBuffettPrice(data.freeCashflow, data.sharesOutstanding, data.earningsGrowth)
    : null

  const averageResult =
    grahamResult && bazinResult && ddmResult && dcfResult && lynchResult && buffettResult
      ? calculateAveragePrice(grahamResult, bazinResult, ddmResult, dcfResult, lynchResult, buffettResult)
      : null

  const viabilityResult =
    data && grahamResult && bazinResult
      ? classifyViability(data, grahamResult, bazinResult)
      : null


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Ações — 5 Métodos de Valuation</CardTitle>
          <CardDescription>
            Graham · Bazin · DDM · DCF (WACC) · Peter Lynch — preço médio justo e classificação de viabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ticker">Código da ação (ticker)</Label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4, VALE3, ITUB4"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                maxLength={10}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !ticker.trim()}>
              {loading ? "Buscando…" : "Analisar"}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {data && grahamResult && bazinResult && ddmResult && dcfResult && lynchResult && buffettResult && averageResult && viabilityResult && (
        <>
          <StockHeader data={data} />

          <AveragePriceCard currentPrice={data.price} result={averageResult} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GrahamCard data={data} result={grahamResult} />
            <BazinCard data={data} result={bazinResult} />
            <DDMCard data={data} result={ddmResult} />
            <DCFCard data={data} result={dcfResult} />
            <LynchCard data={data} result={lynchResult} />
            <BuffettCard data={data} result={buffettResult} />
          </div>

          <ViabilityCard result={viabilityResult} />
        </>
      )}
    </div>
  )
}
