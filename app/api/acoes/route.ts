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
      `${BRAPI_BASE}/quote/${ticker}?modules=summaryProfile,defaultKeyStatistics,financialData&dividends=true${tokenParam}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "Ticker não encontrado ou serviço indisponível" },
        { status: 404 }
      )
    }

    const data = await res.json()
    const result = data?.results?.[0]

    if (!result) {
      return NextResponse.json(
        { error: "Dados não encontrados para o ticker informado" },
        { status: 404 }
      )
    }

    const summary = result.summaryProfile ?? {}
    // earningsPerShare (LPA) lives inside defaultKeyStatistics, not at the root
    const keyStats = result.defaultKeyStatistics ?? {}
    const financial = result.financialData ?? {}

    // Dividends are returned as result.dividendsData.cashDividends[]
    const rawDividends: Array<{ rate?: number; paymentDate?: string }> =
      result.dividendsData?.cashDividends ?? []

    const dividends = rawDividends
      .filter((d) => d.rate && d.rate > 0 && d.paymentDate)
      .map((d) => ({ paymentDate: d.paymentDate as string, rate: d.rate as number }))

    return NextResponse.json({
      symbol: result.symbol,
      name: result.longName ?? result.shortName ?? ticker,
      price: result.regularMarketPrice,
      // LPA: earningsPerShare is in defaultKeyStatistics, not root
      eps: keyStats.earningsPerShare ?? null,
      bookValue: keyStats.bookValue ?? null,
      priceToBook: keyStats.priceToBook ?? null,
      priceEarnings: result.priceEarnings ?? null,
      returnOnEquity: financial.returnOnEquity ?? null,
      debtToEquity: financial.debtToEquity ?? null,
      profitMargins: financial.profitMargins ?? null,
      dividendYield: financial.dividendYield ?? result.dividendYield ?? null,
      sector: summary.sector ?? null,
      sectorKey: summary.sectorKey ?? null,
      dividends,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
