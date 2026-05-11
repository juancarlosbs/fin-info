export interface DividendEntry {
  paymentDate: string
  rate: number
}

export interface StockData {
  symbol: string
  name: string
  price: number
  eps: number | null
  bookValue: number | null
  priceToBook: number | null
  priceEarnings: number | null
  returnOnEquity: number | null
  debtToEquity: number | null
  profitMargins: number | null
  dividendYield: number | null
  sector: string | null
  sectorKey: string | null
  dividends: DividendEntry[]
}

export interface GrahamResult {
  price: number | null
  isValid: boolean
  reason: string | null
}

export interface BazinResult {
  price: number | null
  annualDividend: number
  isValid: boolean
  reason: string | null
}

export type ViabilityClass = "COMPRA_FORTE" | "COMPRA" | "NEUTRO" | "CARO" | "EVITAR"

export interface CriteriaCheck {
  label: string
  value: string
  passed: boolean
  weight: number
}

export interface ViabilityResult {
  classification: ViabilityClass
  score: number
  maxScore: number
  criteria: CriteriaCheck[]
}

export function calculateGrahamPrice(eps: number | null, bookValue: number | null): GrahamResult {
  if (eps === null || bookValue === null) {
    return { price: null, isValid: false, reason: "LPA ou VPA não disponível" }
  }
  if (eps <= 0) {
    return { price: null, isValid: false, reason: "LPA negativo — Graham não aplicável" }
  }
  if (bookValue <= 0) {
    return { price: null, isValid: false, reason: "VPA negativo" }
  }
  return { price: Math.sqrt(22.5 * eps * bookValue), isValid: true, reason: null }
}

export function getAnnualDividend(dividends: DividendEntry[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return dividends
    .filter((d) => new Date(d.paymentDate) >= oneYearAgo)
    .reduce((sum, d) => sum + d.rate, 0)
}

export function getDividendYearsCount(dividends: DividendEntry[]): number {
  if (dividends.length === 0) return 0
  const years = new Set(dividends.map((d) => new Date(d.paymentDate).getFullYear()))
  const current = new Date().getFullYear()
  let count = 0
  for (let y = current - 4; y <= current; y++) {
    if (years.has(y)) count++
  }
  return count
}

export function calculateBazinPrice(dividends: DividendEntry[]): BazinResult {
  const annualDividend = getAnnualDividend(dividends)
  if (annualDividend <= 0) {
    return {
      price: null,
      annualDividend: 0,
      isValid: false,
      reason: "Sem dividendos nos últimos 12 meses",
    }
  }
  return { price: annualDividend / 0.06, annualDividend, isValid: true, reason: null }
}

const SECTOR_LABELS: Record<string, string> = {
  energy: "Energia",
  "financial-services": "Serviços Financeiros",
  technology: "Tecnologia",
  "consumer-cyclical": "Consumo Cíclico",
  "consumer-defensive": "Consumo Defensivo",
  utilities: "Utilidades Públicas",
  healthcare: "Saúde",
  industrials: "Indústria",
  "basic-materials": "Materiais Básicos",
  "real-estate": "Imóveis / FIIs",
  "communication-services": "Comunicação",
}

const DEFENSIVE_SECTORS = new Set([
  "consumer-defensive",
  "utilities",
  "healthcare",
  "financial-services",
  "real-estate",
])

export function getSectorLabel(sectorKey: string | null): string {
  if (!sectorKey) return "Setor não informado"
  return SECTOR_LABELS[sectorKey] ?? sectorKey
}

export function classifyViability(
  data: StockData,
  grahamResult: GrahamResult,
  bazinResult: BazinResult
): ViabilityResult {
  const { price, eps, priceEarnings, priceToBook, returnOnEquity, debtToEquity, profitMargins, dividendYield, dividends, sectorKey } = data

  const dividendYearsCount = getDividendYearsCount(dividends)
  const effectiveDY = dividendYield ?? (bazinResult.annualDividend > 0 && price > 0 ? bazinResult.annualDividend / price : null)

  const criteria: CriteriaCheck[] = [
    {
      label: "Lucro positivo (LPA > 0)",
      value: eps !== null ? `LPA: R$ ${eps.toFixed(2)}` : "Não disponível",
      passed: eps !== null && eps > 0,
      weight: 2,
    },
    {
      label: "ROE ≥ 10%",
      value: returnOnEquity !== null ? `${(returnOnEquity * 100).toFixed(1)}%` : "Não disponível",
      passed: returnOnEquity !== null && returnOnEquity >= 0.1,
      weight: 1,
    },
    {
      label: "P/L ≤ 15 (Graham)",
      value: priceEarnings !== null && priceEarnings > 0 ? priceEarnings.toFixed(1) : "Não disponível",
      passed: priceEarnings !== null && priceEarnings > 0 && priceEarnings <= 15,
      weight: 1,
    },
    {
      label: "P/VP ≤ 1,5 (Graham)",
      value: priceToBook !== null ? priceToBook.toFixed(2) : "Não disponível",
      passed: priceToBook !== null && priceToBook > 0 && priceToBook <= 1.5,
      weight: 1,
    },
    {
      label: "Dividend Yield ≥ 6% (Bazin)",
      value: effectiveDY !== null ? `${(effectiveDY * 100).toFixed(1)}%` : "Não disponível",
      passed: effectiveDY !== null && effectiveDY >= 0.06,
      weight: 1,
    },
    {
      label: "Dividendos consistentes (≥ 5/5 anos)",
      value: `${dividendYearsCount}/5 anos com pagamento`,
      passed: dividendYearsCount >= 5,
      weight: 1,
    },
    {
      label: "Endividamento baixo (Dív/PL ≤ 100%)",
      value: debtToEquity !== null ? `${debtToEquity.toFixed(0)}%` : "Não disponível",
      passed: debtToEquity !== null && debtToEquity <= 100,
      weight: 1,
    },
    {
      label: "Margem líquida positiva",
      value: profitMargins !== null ? `${(profitMargins * 100).toFixed(1)}%` : "Não disponível",
      passed: profitMargins !== null && profitMargins > 0,
      weight: 1,
    },
    {
      label: "Setor defensivo",
      value: getSectorLabel(sectorKey),
      passed: sectorKey !== null && DEFENSIVE_SECTORS.has(sectorKey),
      weight: 0,
    },
  ]

  const weighted = criteria.filter((c) => c.weight > 0)
  const score = weighted.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0)
  const maxScore = weighted.reduce((s, c) => s + c.weight, 0)

  if ((eps !== null && eps <= 0) || (dividends.length === 0 && bazinResult.annualDividend === 0)) {
    return { classification: "EVITAR", score, maxScore, criteria }
  }

  const belowGraham = grahamResult.price !== null && price < grahamResult.price
  const belowBazin = bazinResult.price !== null && price < bazinResult.price

  if (belowGraham && belowBazin && score >= 7) return { classification: "COMPRA_FORTE", score, maxScore, criteria }
  if ((belowGraham || belowBazin) && score >= 5) return { classification: "COMPRA", score, maxScore, criteria }

  const ratios = [
    grahamResult.price !== null ? price / grahamResult.price : null,
    bazinResult.price !== null ? price / bazinResult.price : null,
  ].filter((r): r is number => r !== null)

  const meanRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null

  if (meanRatio !== null && meanRatio <= 1.1) return { classification: "NEUTRO", score, maxScore, criteria }

  return { classification: "CARO", score, maxScore, criteria }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
