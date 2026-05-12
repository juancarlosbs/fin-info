export interface DividendEntry {
  paymentDate: string
  rate: number
}

export interface EarningsEntry {
  year: number
  netIncome: number
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
  earningsGrowth: number | null
  freeCashflow: number | null
  sharesOutstanding: number | null
  beta: number | null
  totalDebt: number | null
  marketCap: number | null
  sector: string | null
  sectorKey: string | null
  dividends: DividendEntry[]
  earningsHistory: EarningsEntry[]
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

export interface DDMResult {
  price: number | null
  isValid: boolean
  reason: string | null
  discountRate: number
  growthRate: number
  annualDividend: number
}

export interface DCFResult {
  price: number | null
  isValid: boolean
  reason: string | null
  wacc: number
  growthRate: number
  terminalGrowth: number
  years: number
  fcfPerShare: number | null
}

export interface LynchResult {
  price: number | null
  isValid: boolean
  reason: string | null
  growthRate: number | null      // valor usado no cálculo (cap 50%)
  rawGrowthRate: number | null   // valor bruto retornado pela API
}

export interface BuffettResult {
  price: number | null        // valor intrínseco
  safetyPrice: number | null  // com margem de segurança de 30%
  isValid: boolean
  reason: string | null
  discountRate: number
  growthRate: number
  terminalGrowth: number
  years: number
  oePerShare: number | null
}

export interface AveragePriceResult {
  price: number | null
  methods: { label: string; price: number | null; isValid: boolean }[]
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

// ─── Graham ───────────────────────────────────────────────────────────────────

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

// ─── Bazin ────────────────────────────────────────────────────────────────────

export function getConsistentEarningsLabel(history: EarningsEntry[]): { label: string; passed: boolean } {
  if (history.length === 0) return { label: "Histórico não disponível", passed: false }
  const positive = history.filter((e) => e.netIncome > 0).length
  const total = history.length
  const years = history.map((e) => e.year).sort((a, b) => a - b)
  return {
    label: `${positive}/${total} anos positivos (${years[0]}–${years[years.length - 1]})`,
    passed: positive === total,
  }
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
    return { price: null, annualDividend: 0, isValid: false, reason: "Sem dividendos nos últimos 12 meses" }
  }
  return { price: annualDividend / 0.06, annualDividend, isValid: true, reason: null }
}

// ─── DDM (Gordon Growth Model) ────────────────────────────────────────────────
// P = DPA × (1 + g) / (r - g)

export function calculateDDMPrice(
  dividends: DividendEntry[],
  discountRate = 0.13,
  growthRate = 0.03
): DDMResult {
  const annualDividend = getAnnualDividend(dividends)
  const base = { discountRate, growthRate, annualDividend }
  if (annualDividend <= 0) {
    return { ...base, price: null, isValid: false, reason: "Sem dividendos nos últimos 12 meses" }
  }
  if (discountRate <= growthRate) {
    return { ...base, price: null, isValid: false, reason: "Taxa de desconto deve ser maior que crescimento" }
  }
  return { ...base, price: (annualDividend * (1 + growthRate)) / (discountRate - growthRate), isValid: true, reason: null }
}

// ─── DCF (FCL descontado pelo WACC — 2 estágios) ─────────────────────────────
// P = Σ FCL/ação × (1+g)^t / (1+WACC)^t  +  TV / (1+WACC)^N
// TV = FCL/ação × (1+g)^N × (1+g_t) / (WACC - g_t)
//
// WACC = Ke × E/(D+E)  +  Kd × (1-t) × D/(D+E)
// Ke   = Selic + β × prêmio de risco Brasil (5,5%)
// Kd   = 12% (custo médio corporativo estimado no Brasil)
// t    = 34% (IRPJ + CSLL)

function calcWACC(
  beta: number,
  marketCap: number,
  totalDebt: number
): number {
  const RF = 0.13        // Selic
  const MRP = 0.055      // Prêmio de risco de mercado Brasil
  const KD = 0.12        // Custo da dívida corporativa BR
  const TAX = 0.34       // Alíquota efetiva IRPJ+CSLL

  const ke = RF + beta * MRP
  const e = Math.max(marketCap, 0)
  const d = Math.max(totalDebt, 0)
  const total = e + d
  if (total <= 0) return ke

  const wacc = (ke * e) / total + (KD * (1 - TAX) * d) / total
  return Math.min(Math.max(wacc, 0.05), 0.40) // clamp 5%–40%
}

export function calculateDCFPrice(
  freeCashflow: number | null,
  sharesOutstanding: number | null,
  beta: number | null,
  marketCap: number | null,
  totalDebt: number | null,
  earningsGrowth: number | null,
  terminalGrowth = 0.03,
  years = 5
): DCFResult {
  const growthRate =
    earningsGrowth !== null ? Math.min(Math.max(earningsGrowth, -0.2), 0.3) : 0.05

  const wacc = calcWACC(beta ?? 1.0, marketCap ?? 0, totalDebt ?? 0)
  const base = { wacc, growthRate, terminalGrowth, years, fcfPerShare: null as number | null }

  if (freeCashflow === null || sharesOutstanding === null || sharesOutstanding <= 0) {
    return { ...base, price: null, isValid: false, reason: "FCL ou ações em circulação não disponíveis" }
  }
  if (freeCashflow <= 0) {
    return { ...base, price: null, isValid: false, reason: "FCL negativo — DCF não aplicável" }
  }
  if (wacc <= terminalGrowth) {
    return { ...base, price: null, isValid: false, reason: "WACC deve ser maior que crescimento terminal" }
  }

  const fcfPerShare = freeCashflow / sharesOutstanding

  let pv1 = 0
  for (let t = 1; t <= years; t++) {
    pv1 += (fcfPerShare * Math.pow(1 + growthRate, t)) / Math.pow(1 + wacc, t)
  }

  const fcfN = fcfPerShare * Math.pow(1 + growthRate, years)
  const terminalValue = (fcfN * (1 + terminalGrowth)) / (wacc - terminalGrowth)
  const pvTerminal = terminalValue / Math.pow(1 + wacc, years)

  return { ...base, fcfPerShare, price: pv1 + pvTerminal, isValid: true, reason: null }
}

// ─── Warren Buffett — Owner Earnings (Valor Intrínseco) ──────────────────────
// P = Σ OE/ação × (1+g)^t / (1+r)^t  +  TV / (1+r)^N
// TV = OE/ação × (1+g)^N × (1+g_t) / (r - g_t)
//
// Diferenças do DCF clássico:
//  - r = 10% (taxa livre de risco; Buffett não adiciona prêmio de risco)
//  - g cap = 15% (crescimento conservador — evita hipergrowth)
//  - N = 10 anos (perspectiva de longo prazo)
//  - Margem de Segurança de 30%: preço de compra = Intrínseco × 0,70

export function calculateBuffettPrice(
  freeCashflow: number | null,
  sharesOutstanding: number | null,
  earningsGrowth: number | null,
  discountRate = 0.10,
  terminalGrowth = 0.03,
  marginOfSafety = 0.30,
  years = 10
): BuffettResult {
  const growthRate =
    earningsGrowth !== null ? Math.min(Math.max(earningsGrowth, 0), 0.15) : 0.05
  const base = { discountRate, growthRate, terminalGrowth, years, oePerShare: null as number | null }

  if (freeCashflow === null || sharesOutstanding === null || sharesOutstanding <= 0) {
    return { ...base, price: null, safetyPrice: null, isValid: false, reason: "Owner Earnings ou ações em circulação não disponíveis" }
  }
  if (freeCashflow <= 0) {
    return { ...base, price: null, safetyPrice: null, isValid: false, reason: "Owner Earnings negativo — método não aplicável" }
  }
  if (discountRate <= terminalGrowth) {
    return { ...base, price: null, safetyPrice: null, isValid: false, reason: "Taxa de desconto deve ser maior que crescimento terminal" }
  }

  const oePerShare = freeCashflow / sharesOutstanding

  let pv1 = 0
  for (let t = 1; t <= years; t++) {
    pv1 += (oePerShare * Math.pow(1 + growthRate, t)) / Math.pow(1 + discountRate, t)
  }

  const oeN = oePerShare * Math.pow(1 + growthRate, years)
  const terminalValue = (oeN * (1 + terminalGrowth)) / (discountRate - terminalGrowth)
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, years)

  const intrinsic = pv1 + pvTerminal
  const safetyPrice = intrinsic * (1 - marginOfSafety)

  return { ...base, oePerShare, price: intrinsic, safetyPrice, isValid: true, reason: null }
}

// ─── Peter Lynch — Preço PEG ──────────────────────────────────────────────────
// Ação está justa quando PEG = 1  →  P/L = g(%)  →  P = LPA × g(%)
// Lynch considera crescimento sustentável entre 10% e 25%

export function calculateLynchPrice(
  eps: number | null,
  earningsGrowth: number | null
): LynchResult {
  const rawGrowthRate = earningsGrowth !== null ? earningsGrowth : null
  // Lynch aplica PEG a crescimentos sustentáveis (10–25%); acima de 50% é crescimento
  // excepcional/cíclico que distorce o PEG — limitado para evitar valores sem sentido
  const growthRate = rawGrowthRate !== null ? Math.min(rawGrowthRate, 0.50) : null

  if (eps === null) {
    return { price: null, isValid: false, reason: "LPA não disponível", growthRate, rawGrowthRate }
  }
  if (eps <= 0) {
    return { price: null, isValid: false, reason: "LPA negativo — Lynch não aplicável", growthRate, rawGrowthRate }
  }
  if (growthRate === null || growthRate <= 0) {
    return { price: null, isValid: false, reason: "Crescimento não disponível ou negativo", growthRate, rawGrowthRate }
  }

  const growthPct = growthRate * 100 // Lynch usa o número percentual (ex: 15, não 0.15)
  return { price: eps * growthPct, isValid: true, reason: null, growthRate, rawGrowthRate }
}

// ─── Média dos métodos ────────────────────────────────────────────────────────

export function calculateAveragePrice(
  graham: GrahamResult,
  bazin: BazinResult,
  ddm: DDMResult,
  dcf: DCFResult,
  lynch: LynchResult,
  buffett: BuffettResult
): AveragePriceResult {
  const methods = [
    { label: "Graham", price: graham.isValid ? graham.price : null, isValid: graham.isValid },
    { label: "Bazin", price: bazin.isValid ? bazin.price : null, isValid: bazin.isValid },
    { label: "DDM", price: ddm.isValid ? ddm.price : null, isValid: ddm.isValid },
    { label: "DCF", price: dcf.isValid ? dcf.price : null, isValid: dcf.isValid },
    { label: "Lynch", price: lynch.isValid ? lynch.price : null, isValid: lynch.isValid },
    { label: "Buffett", price: buffett.isValid ? buffett.price : null, isValid: buffett.isValid },
  ]
  const validPrices = methods.filter((m) => m.price !== null).map((m) => m.price as number)
  const price =
    validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : null
  return { price, methods }
}

// ─── Setor (sectorKey — slug usado internamente) ──────────────────────────────

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

// ─── Classificação setorial BrAPI (campo "sector" em inglês) ─────────────────

export interface SectorInfo {
  ordem: number | null
  nomePt: string
  categoria: string
  classificacao: string
  nota: number | null
  risco: string
  cor: string
  hex: string
  comentario: string
}

export interface SectorClassificationResult extends SectorInfo {
  sectorOriginal: string
}

const BRAPI_SECTOR_CLASSIFICATION: Record<string, SectorInfo> = {
  "Finance": {
    ordem: 1,
    nomePt: "Financeiro",
    categoria: "Setor prioritário",
    classificacao: "Excelente",
    nota: 100,
    risco: "Médio",
    cor: "azul",
    hex: "#2563EB",
    comentario: "Setor considerado um dos mais fortes para análise de longo prazo, especialmente por sua capacidade de gerar lucro, recorrência de receita, escala e rentabilidade. Inclui bancos, seguradoras e instituições financeiras. Ainda exige análise de inadimplência, ROE, eficiência operacional, lucro recorrente, governança e preço.",
  },
  "Utilities": {
    ordem: 2,
    nomePt: "Serviços públicos / utilities",
    categoria: "Setor perene",
    classificacao: "Excelente",
    nota: 95,
    risco: "Baixo",
    cor: "azul",
    hex: "#2563EB",
    comentario: "Setor ligado a serviços essenciais, como energia elétrica, transmissão, distribuição e saneamento. Costuma ter demanda estável, maior previsibilidade de receita e boa resiliência em crises. Exige atenção a regulação, dívida, revisão tarifária, lucro e gestão.",
  },
  "Consumer Non-Durables": {
    ordem: 3,
    nomePt: "Consumo não durável",
    categoria: "Setor perene",
    classificacao: "Excelente",
    nota: 90,
    risco: "Baixo a médio",
    cor: "azul",
    hex: "#2563EB",
    comentario: "Setor ligado a produtos de consumo recorrente, como alimentos, bebidas, higiene e itens essenciais. A demanda tende a se manter mesmo em cenários econômicos difíceis, tornando o setor mais defensivo.",
  },
  "Health Services": {
    ordem: 4,
    nomePt: "Serviços de saúde",
    categoria: "Setor perene",
    classificacao: "Muito viável",
    nota: 86,
    risco: "Médio",
    cor: "verde",
    hex: "#16A34A",
    comentario: "Setor ligado a hospitais, laboratórios, planos de saúde e serviços médicos. A demanda por saúde tende a ser estrutural e recorrente, mas ainda exige atenção a margens, dívida, aquisições, regulação e eficiência operacional.",
  },
  "Health Technology": {
    ordem: 5,
    nomePt: "Tecnologia em saúde / farmacêuticas",
    categoria: "Setor perene",
    classificacao: "Muito viável",
    nota: 82,
    risco: "Médio",
    cor: "verde",
    hex: "#16A34A",
    comentario: "Setor ligado a medicamentos, equipamentos e soluções de saúde. Possui demanda estrutural positiva, mas pode depender de inovação, escala, aprovação regulatória e margens.",
  },
  "Communications": {
    ordem: 6,
    nomePt: "Comunicações e telecom",
    categoria: "Intermediário",
    classificacao: "Viável",
    nota: 76,
    risco: "Médio",
    cor: "verde",
    hex: "#16A34A",
    comentario: "Setor com receita relativamente recorrente, especialmente em telecom, mas com crescimento limitado, alta competição e necessidade constante de investimento.",
  },
  "Industrial Services": {
    ordem: 7,
    nomePt: "Serviços industriais e infraestrutura",
    categoria: "Intermediário",
    classificacao: "Viável",
    nota: 72,
    risco: "Médio",
    cor: "verde",
    hex: "#16A34A",
    comentario: "Pode incluir infraestrutura, concessões, engenharia e serviços industriais. Alguns negócios possuem contratos longos e previsibilidade, mas ainda dependem de capex, dívida, execução e regulação.",
  },
  "Distribution Services": {
    ordem: 8,
    nomePt: "Distribuição e logística comercial",
    categoria: "Intermediário",
    classificacao: "Viável",
    nota: 68,
    risco: "Médio",
    cor: "verde",
    hex: "#16A34A",
    comentario: "Setor ligado a distribuição, atacado e logística comercial. Pode ter escala e recorrência, mas depende de volume, capital de giro, margem operacional e atividade econômica.",
  },
  "Energy Minerals": {
    ordem: 9,
    nomePt: "Petróleo, gás e combustíveis",
    categoria: "Cíclico",
    classificacao: "Viável com cautela",
    nota: 62,
    risco: "Médio a alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Setor com grande geração de caixa em ciclos favoráveis, mas muito dependente de preço internacional do petróleo, câmbio, regulação e interferência política. Deve ser analisado com cautela.",
  },
  "Non-Energy Minerals": {
    ordem: 10,
    nomePt: "Mineração, metais e materiais básicos",
    categoria: "Cíclico",
    classificacao: "Requer atenção",
    nota: 58,
    risco: "Alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Setor de commodities minerais, como mineração, siderurgia e metais. Pode ser muito lucrativo em ciclos favoráveis, mas é altamente sensível à demanda global, câmbio e preço das commodities.",
  },
  "Process Industries": {
    ordem: 11,
    nomePt: "Indústrias de processo",
    categoria: "Cíclico",
    classificacao: "Requer atenção",
    nota: 56,
    risco: "Médio a alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Pode envolver papel e celulose, química, agroindústria e outros negócios industriais de transformação. Geralmente possui exposição a ciclo econômico, custos, câmbio, margens e commodities.",
  },
  "Producer Manufacturing": {
    ordem: 12,
    nomePt: "Manufatura industrial",
    categoria: "Cíclico",
    classificacao: "Requer atenção",
    nota: 52,
    risco: "Médio a alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Setor industrial sensível ao ciclo econômico, custos de produção, demanda, câmbio e capacidade operacional. Pode ter boas empresas, mas exige análise cuidadosa de margem, dívida, eficiência e geração de caixa.",
  },
  "Technology Services": {
    ordem: 13,
    nomePt: "Serviços de tecnologia",
    categoria: "Intermediário",
    classificacao: "Requer atenção",
    nota: 50,
    risco: "Médio a alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Setor com potencial de crescimento, mas muitas vezes depende de escala, inovação, margens futuras e valuation. Na bolsa brasileira há poucas empresas consolidadas.",
  },
  "Electronic Technology": {
    ordem: 14,
    nomePt: "Tecnologia eletrônica",
    categoria: "Intermediário",
    classificacao: "Requer atenção",
    nota: 48,
    risco: "Médio a alto",
    cor: "amarelo",
    hex: "#EAB308",
    comentario: "Setor ligado a equipamentos, eletrônicos, hardware e tecnologia embarcada. Pode ter potencial, mas costuma depender de inovação, escala, fornecedores, câmbio e competição.",
  },
  "Commercial Services": {
    ordem: 15,
    nomePt: "Serviços comerciais",
    categoria: "Pouco perene",
    classificacao: "Requer atenção",
    nota: 42,
    risco: "Alto",
    cor: "laranja",
    hex: "#F97316",
    comentario: "Setor amplo, podendo incluir educação, serviços terceirizados, consultorias e outros negócios. A qualidade varia bastante, mas muitos modelos dependem de ciclo econômico, margem, escala e recorrência.",
  },
  "Consumer Durables": {
    ordem: 16,
    nomePt: "Consumo durável",
    categoria: "Pouco perene",
    classificacao: "Arriscado",
    nota: 35,
    risco: "Alto",
    cor: "vermelho",
    hex: "#DC2626",
    comentario: "Setor ligado a bens duráveis, como imóveis, veículos, eletrodomésticos e construção. É muito sensível a juros, crédito, renda da população e ciclo econômico.",
  },
  "Retail Trade": {
    ordem: 17,
    nomePt: "Varejo",
    categoria: "Pouco perene",
    classificacao: "Arriscado",
    nota: 30,
    risco: "Alto",
    cor: "vermelho",
    hex: "#DC2626",
    comentario: "Setor com margens apertadas, alta concorrência e forte dependência de crédito, renda, consumo e juros. Exige análise rigorosa de dívida, caixa, margem, estoque e crescimento real.",
  },
  "Consumer Services": {
    ordem: 18,
    nomePt: "Serviços ao consumidor",
    categoria: "Pouco perene",
    classificacao: "Arriscado",
    nota: 28,
    risco: "Alto",
    cor: "vermelho",
    hex: "#DC2626",
    comentario: "Setor normalmente ligado a serviços discricionários, lazer, turismo, educação ou consumo não essencial. Costuma depender de renda disponível, confiança do consumidor e ciclo econômico.",
  },
  "Transportation": {
    ordem: 19,
    nomePt: "Transporte",
    categoria: "Pouco perene",
    classificacao: "Alto risco",
    nota: 25,
    risco: "Muito alto",
    cor: "vermelho",
    hex: "#DC2626",
    comentario: "Setor intensivo em capital, sensível a combustível, câmbio, demanda, dívida e ciclo econômico. Pode ter margens frágeis e alta volatilidade.",
  },
  "Miscellaneous": {
    ordem: 20,
    nomePt: "Diversos / não classificado claramente",
    categoria: "Indefinido",
    classificacao: "Não classificado",
    nota: null,
    risco: "Indefinido",
    cor: "cinza",
    hex: "#6B7280",
    comentario: "A brapi retornou um setor genérico ou pouco específico. Não use o setor como critério forte de viabilidade. Analise os fundamentos da empresa individualmente.",
  },
}

const BRAPI_SECTOR_TOTAL = Object.keys(BRAPI_SECTOR_CLASSIFICATION).length

export function getClassificacaoSetorialBrapi(sector: string | null): SectorClassificationResult {
  const fallback: SectorClassificationResult = {
    sectorOriginal: sector ?? "",
    ordem: null,
    nomePt: "Setor não mapeado",
    categoria: "Indefinido",
    classificacao: "Não classificado",
    nota: null,
    risco: "Indefinido",
    cor: "cinza",
    hex: "#6B7280",
    comentario: "Este setor ainda não possui uma classificação definida na aplicação. Analise os fundamentos da empresa individualmente.",
  }
  if (!sector) return fallback
  const entry = BRAPI_SECTOR_CLASSIFICATION[sector]
  if (!entry) return { ...fallback, sectorOriginal: sector }
  return { ...entry, sectorOriginal: sector }
}

export { BRAPI_SECTOR_TOTAL }

// ─── Viabilidade ──────────────────────────────────────────────────────────────

export function classifyViability(
  data: StockData,
  grahamResult: GrahamResult,
  bazinResult: BazinResult,
  buffettResult: BuffettResult
): ViabilityResult {
  const { price, eps, priceEarnings, priceToBook, returnOnEquity, debtToEquity, profitMargins, dividendYield, dividends, sectorKey, freeCashflow, earningsGrowth, earningsHistory } = data

  const dividendYearsCount = getDividendYearsCount(dividends)
  const effectiveDY =
    dividendYield ??
    (bazinResult.annualDividend > 0 && price > 0 ? bazinResult.annualDividend / price : null)
  const earningsConsistency = getConsistentEarningsLabel(earningsHistory)

  const criteria: CriteriaCheck[] = [
    {
      label: "Lucro positivo (LPA > 0)",
      value: eps !== null ? `LPA: R$ ${eps.toFixed(2)}` : "Não disponível",
      passed: eps !== null && eps > 0,
      weight: 2,
    },
    {
      label: "Lucros consistentes (histórico DRE)",
      value: earningsConsistency.label,
      passed: earningsConsistency.passed,
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
      label: "FCL positivo — Owner Earnings (Buffett)",
      value: freeCashflow !== null ? (freeCashflow > 0 ? "Positivo" : "Negativo") : "Não disponível",
      passed: freeCashflow !== null && freeCashflow > 0,
      weight: 1,
    },
    {
      label: "Crescimento de lucros > 0% (Buffett)",
      value: earningsGrowth !== null ? `${(earningsGrowth * 100).toFixed(1)}%` : "Não disponível",
      passed: earningsGrowth !== null && earningsGrowth > 0,
      weight: 1,
    },
    {
      label: "Preço abaixo do valor intrínseco Buffett (MOS 30%)",
      value: buffettResult.isValid && buffettResult.safetyPrice !== null
        ? `Preço MOS: R$ ${buffettResult.safetyPrice.toFixed(2)}`
        : "Não calculado",
      passed: buffettResult.isValid && buffettResult.safetyPrice !== null && price < buffettResult.safetyPrice,
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

// ─── Formatação ───────────────────────────────────────────────────────────────

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
