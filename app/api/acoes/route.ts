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
    const [quoteRes, dividendsRes] = await Promise.all([
      fetch(
        `${BRAPI_BASE}/quote/${ticker}?modules=summaryProfile,defaultKeyStatistics,financialData${tokenParam}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `${BRAPI_BASE}/quote/${ticker}/dividends?lastDividends=60${tokenParam}`,
        { next: { revalidate: 3600 } }
      ),
    ])

    if (!quoteRes.ok) {
      return NextResponse.json(
        { error: "Ticker não encontrado ou serviço indisponível" },
        { status: 404 }
      )
    }

    const quoteData = await quoteRes.json()
    const dividendsData = dividendsRes.ok ? await dividendsRes.json() : null

    const result = quoteData?.results?.[0]
    if (!result) {
      return NextResponse.json(
        { error: "Dados não encontrados para o ticker informado" },
        { status: 404 }
      )
    }

    const summary = result.summaryProfile ?? {}
    const keyStats = result.defaultKeyStatistics ?? {}
    const financial = result.financialData ?? {}

    const rawDividends: Array<{ rate?: number; paymentDate?: string }> =
      dividendsData?.results?.dividendsData?.cashDividends ?? []

    const dividends = rawDividends
      .filter((d) => d.rate && d.rate > 0 && d.paymentDate)
      .map((d) => ({ paymentDate: d.paymentDate as string, rate: d.rate as number }))

    return NextResponse.json({
      symbol: result.symbol,
      name: result.longName ?? result.shortName ?? ticker,
      price: result.regularMarketPrice,
      eps: result.earningsPerShare ?? keyStats.trailingEps ?? null,
      bookValue: keyStats.bookValue ?? null,
      priceToBook: keyStats.priceToBook ?? result.priceToBook ?? null,
      priceEarnings: result.priceEarnings ?? result.regularMarketPE ?? null,
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
