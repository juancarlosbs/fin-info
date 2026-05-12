import { NextRequest, NextResponse } from "next/server"

const BRAPI_BASE = "https://brapi.dev/api"

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase().trim()

  if (!ticker) {
    return NextResponse.json({ error: "Ticker não informado" }, { status: 400 })
  }

  const token = process.env.BRAPI_TOKEN
  const tokenParam = token ? `&token=${token}` : ""

  try {
    // Dividends are fetched via dividends=true in the same quote request (not a separate endpoint)
    const res = await fetch(
      `${BRAPI_BASE}/quote/${ticker}?modules=summaryProfile,defaultKeyStatistics,incomeStatementHistory&dividends=true${tokenParam}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      let message = "Ticker não encontrado ou serviço indisponível"
      if (res.status === 401 || res.status === 403) {
        message =
          "Acesso negado — este ticker requer um plano pago da BrAPI. " +
          "No plano gratuito só estão disponíveis: PETR4, MGLU3, VALE3, ITUB4."
      } else {
        try {
          const body = await res.json()
          if (typeof body?.message === "string") message = body.message
          else if (typeof body?.error === "string") message = body.error
        } catch { /* ignore */ }
      }
      return NextResponse.json({ error: message }, { status: res.status })
    }

    const data = await res.json()
    const result = data?.results?.[0]

    if (!result) {
      const token = process.env.BRAPI_TOKEN
      const hint = !token
        ? " Configure BRAPI_TOKEN para acessar outros tickers além dos 4 gratuitos."
        : ""
      return NextResponse.json(
        { error: `Ticker "${ticker}" não encontrado.${hint}` },
        { status: 404 }
      )
    }

    const summary = result.summaryProfile ?? {}
    // earningsPerShare (LPA) lives inside defaultKeyStatistics, not at the root
    const keyStats = result.defaultKeyStatistics ?? {}

    // Dividends are returned as result.dividendsData.cashDividends[]
    const rawDividends: Array<{ rate?: number; paymentDate?: string }> =
      result.dividendsData?.cashDividends ?? []

    const dividends = rawDividends
      .filter((d) => d.rate && d.rate > 0 && d.paymentDate)
      .map((d) => ({ paymentDate: d.paymentDate as string, rate: d.rate as number }))

    // incomeStatementHistory: annual net income (Startup plan)
    // BrAPI may return a flat array or the Yahoo Finance nested format
    type RawIncomeEntry = Record<string, unknown>
    const rawIncome: RawIncomeEntry[] = Array.isArray(result.incomeStatementHistory)
      ? result.incomeStatementHistory
      : (result.incomeStatementHistory?.incomeStatementHistory ?? [])

    const earningsHistory = rawIncome
      .map((e) => {
        const rawNI = e.netIncome
        const netIncome =
          typeof rawNI === "number" ? rawNI
          : typeof rawNI === "object" && rawNI !== null ? ((rawNI as { raw?: number }).raw ?? null)
          : null

        const rawDate = e.date ?? e.endDate
        const dateStr =
          typeof rawDate === "string" ? rawDate
          : typeof rawDate === "number" ? new Date(rawDate * 1000).toISOString()
          : typeof rawDate === "object" && rawDate !== null ? ((rawDate as { fmt?: string }).fmt ?? null)
          : null

        if (netIncome === null || dateStr === null) return null
        return { year: new Date(dateStr).getFullYear(), netIncome }
      })
      .filter((e): e is { year: number; netIncome: number } => e !== null)
      .sort((a, b) => a.year - b.year)

    return NextResponse.json({
      symbol: result.symbol,
      name: result.longName ?? result.shortName ?? ticker,
      price: result.regularMarketPrice,
      eps: keyStats.earningsPerShare ?? null,
      bookValue: keyStats.bookValue ?? null,
      priceToBook: keyStats.priceToBook ?? null,
      priceEarnings: result.priceEarnings ?? null,
      dividendYield: result.dividendYield ?? null,
      sharesOutstanding: keyStats.sharesOutstanding ?? keyStats.impliedSharesOutstanding ?? null,
      sector: summary.sector ?? null,
      sectorKey: summary.sectorKey ?? null,
      dividends,
      earningsHistory,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
