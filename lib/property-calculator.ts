export interface PropertyInputs {
  propertyPrice: number       // valor do imóvel
  downPaymentPct: number      // entrada em %
  financingYears: number      // prazo em anos
  financingRate: number       // taxa do financiamento % a.a.
  investmentRate: number      // taxa de rendimento % a.a.
  monthlyRent: number         // valor do aluguel
  appreciationRate: number    // valorização do imóvel % a.a.
  monthlyBudget: number       // orçamento mensal total disponível
}

export interface MonthlySnap {
  month: number
  rentInvest: number      // patrimônio líquido cenário 1
  financeInvest: number   // patrimônio líquido cenário 2
  financeOnly: number     // patrimônio líquido cenário 3
  financeAmortize: number // patrimônio líquido cenário 4
}

export interface ScenarioSummary {
  finalWealth: number
  propertyValue: number
  remainingDebt: number
  portfolio: number
  totalPaid: number
  paidOffMonth: number | null // cenário 4: mês em que quitou
}

export interface PropertyResult {
  scenarios: {
    rentInvest: ScenarioSummary
    financeInvest: ScenarioSummary
    financeOnly: ScenarioSummary
    financeAmortize: ScenarioSummary
  }
  breakdown: MonthlySnap[]
  totalMonths: number
}

export function calculatePropertyScenarios(inputs: PropertyInputs): PropertyResult {
  const {
    propertyPrice,
    downPaymentPct,
    financingYears,
    financingRate,
    investmentRate,
    monthlyRent,
    appreciationRate,
    monthlyBudget,
  } = inputs

  const totalMonths = financingYears * 12
  const downPayment = propertyPrice * (downPaymentPct / 100)
  const loanAmount = propertyPrice - downPayment

  const monthlyFinRate = Math.pow(1 + financingRate / 100, 1 / 12) - 1
  const monthlyInvRate = Math.pow(1 + investmentRate / 100, 1 / 12) - 1
  const monthlyAppRate = Math.pow(1 + appreciationRate / 100, 1 / 12) - 1

  // SAC: parcela de amortização fixa = loanAmount / totalMonths
  const sacPrincipal = loanAmount / totalMonths

  const breakdown: MonthlySnap[] = []

  // ── Cenário 1: Aluguel + Investir ──────────────────────────────────────────
  let c1Portfolio = downPayment // investe a entrada imediatamente
  let c1TotalPaid = downPayment

  // ── Cenário 2: Financiamento + Investir ────────────────────────────────────
  let c2Balance = loanAmount
  let c2Portfolio = 0
  let c2TotalPaid = downPayment
  let c2PropertyValue = propertyPrice

  // ── Cenário 3: Apenas Financiar ────────────────────────────────────────────
  let c3Balance = loanAmount
  let c3TotalPaid = downPayment
  let c3PropertyValue = propertyPrice

  // ── Cenário 4: Financiar e Amortizar ───────────────────────────────────────
  let c4Balance = loanAmount
  let c4TotalPaid = downPayment
  let c4PropertyValue = propertyPrice
  let c4PaidOffMonth: number | null = null

  for (let month = 1; month <= totalMonths; month++) {
    // — Cenário 1 —
    const c1MonthlyInvest = Math.max(0, monthlyBudget - monthlyRent)
    c1Portfolio = c1Portfolio * (1 + monthlyInvRate) + c1MonthlyInvest
    c1TotalPaid += monthlyRent + c1MonthlyInvest

    // — Cenário 2 —
    const c2Interest = c2Balance * monthlyFinRate
    const c2Payment = Math.min(sacPrincipal + c2Interest, c2Balance + c2Interest)
    const c2Surplus = Math.max(0, monthlyBudget - c2Payment)
    c2Portfolio = c2Portfolio * (1 + monthlyInvRate) + c2Surplus
    c2Balance = Math.max(0, c2Balance - sacPrincipal)
    c2PropertyValue *= 1 + monthlyAppRate
    c2TotalPaid += c2Payment

    // — Cenário 3 —
    const c3Interest = c3Balance * monthlyFinRate
    const c3Payment = Math.min(sacPrincipal + c3Interest, c3Balance + c3Interest)
    c3Balance = Math.max(0, c3Balance - sacPrincipal)
    c3PropertyValue *= 1 + monthlyAppRate
    c3TotalPaid += c3Payment

    // — Cenário 4 —
    let c4Wealth: number
    if (c4Balance <= 0) {
      // já quitou: sobra vai acumular como portfólio (mas no cenário 4 amortiza)
      c4PropertyValue *= 1 + monthlyAppRate
      c4Wealth = c4PropertyValue
    } else {
      const c4Interest = c4Balance * monthlyFinRate
      const c4RegPayment = sacPrincipal + c4Interest
      const c4Extra = Math.max(0, monthlyBudget - c4RegPayment)
      c4TotalPaid += Math.min(c4RegPayment, c4Balance + c4Interest) + Math.min(c4Extra, c4Balance)
      c4Balance = Math.max(0, c4Balance - sacPrincipal - c4Extra)
      if (c4Balance === 0 && c4PaidOffMonth === null) {
        c4PaidOffMonth = month
      }
      c4PropertyValue *= 1 + monthlyAppRate
      c4Wealth = c4PropertyValue - c4Balance
    }

    breakdown.push({
      month,
      rentInvest: c1Portfolio,
      financeInvest: c2PropertyValue - c2Balance + c2Portfolio,
      financeOnly: c3PropertyValue - c3Balance,
      financeAmortize: c4Wealth,
    })
  }

  return {
    scenarios: {
      rentInvest: {
        finalWealth: c1Portfolio,
        propertyValue: 0,
        remainingDebt: 0,
        portfolio: c1Portfolio,
        totalPaid: c1TotalPaid,
        paidOffMonth: null,
      },
      financeInvest: {
        finalWealth: c2PropertyValue - c2Balance + c2Portfolio,
        propertyValue: c2PropertyValue,
        remainingDebt: c2Balance,
        portfolio: c2Portfolio,
        totalPaid: c2TotalPaid,
        paidOffMonth: null,
      },
      financeOnly: {
        finalWealth: c3PropertyValue - c3Balance,
        propertyValue: c3PropertyValue,
        remainingDebt: c3Balance,
        portfolio: 0,
        totalPaid: c3TotalPaid,
        paidOffMonth: null,
      },
      financeAmortize: {
        finalWealth: c4PropertyValue - c4Balance,
        propertyValue: c4PropertyValue,
        remainingDebt: c4Balance,
        portfolio: 0,
        totalPaid: c4TotalPaid,
        paidOffMonth: c4PaidOffMonth,
      },
    },
    breakdown,
    totalMonths,
  }
}
