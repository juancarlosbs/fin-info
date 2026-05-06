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

export interface RentInvestSnap {
  correctedRent: number
  monthlyInvestment: number
  portfolio: number
  totalPaid: number
}

export interface FinanceInvestSnap {
  payment: number
  interest: number
  principal: number
  monthlyInvestment: number
  propertyValue: number
  remainingDebt: number
  portfolio: number
  totalPaid: number
}

export interface FinanceOnlySnap {
  payment: number
  interest: number
  principal: number
  propertyValue: number
  remainingDebt: number
  totalPaid: number
}

export interface FinanceAmortizeSnap {
  regularPayment: number
  interest: number
  scheduledPrincipal: number
  extraAmortization: number
  monthlyInvestment: number
  propertyValue: number
  remainingDebt: number
  portfolio: number
  totalPaid: number
  paidOff: boolean
}

export interface MonthlySnap {
  month: number
  rentInvest: number      // patrimônio líquido cenário 1
  financeInvest: number   // patrimônio líquido cenário 2
  financeOnly: number     // patrimônio líquido cenário 3
  financeAmortize: number // patrimônio líquido cenário 4
  rentInvestDetails: RentInvestSnap
  financeInvestDetails: FinanceInvestSnap
  financeOnlyDetails: FinanceOnlySnap
  financeAmortizeDetails: FinanceAmortizeSnap
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
  let c4Portfolio = 0
  let c4TotalPaid = downPayment
  let c4PropertyValue = propertyPrice
  let c4PaidOffMonth: number | null = null

  for (let month = 1; month <= totalMonths; month++) {
    const correctedRent = monthlyRent * Math.pow(1 + monthlyAppRate, month - 1)

    // — Cenário 1 —
    const c1MonthlyInvest = Math.max(0, monthlyBudget - correctedRent)
    c1Portfolio = c1Portfolio * (1 + monthlyInvRate) + c1MonthlyInvest
    c1TotalPaid += correctedRent + c1MonthlyInvest

    // — Cenário 2 —
    const c2Interest = c2Balance * monthlyFinRate
    const c2Principal = Math.min(sacPrincipal, c2Balance)
    const c2Payment = c2Principal + c2Interest
    const c2Surplus = Math.max(0, monthlyBudget - c2Payment)
    c2Portfolio = c2Portfolio * (1 + monthlyInvRate) + c2Surplus
    c2Balance = Math.max(0, c2Balance - c2Principal)
    c2PropertyValue *= 1 + monthlyAppRate
    c2TotalPaid += c2Payment

    // — Cenário 3 —
    const c3Interest = c3Balance * monthlyFinRate
    const c3Principal = Math.min(sacPrincipal, c3Balance)
    const c3Payment = c3Principal + c3Interest
    c3Balance = Math.max(0, c3Balance - c3Principal)
    c3PropertyValue *= 1 + monthlyAppRate
    c3TotalPaid += c3Payment

    // — Cenário 4 —
    c4Portfolio *= 1 + monthlyInvRate
    let c4RegularPayment = 0
    let c4Interest = 0
    let c4ScheduledPrincipal = 0
    let c4ExtraAmortization = 0
    let c4MonthlyInvestment = 0

    if (c4Balance <= 0) {
      // Já quitou: o orçamento que deixou de ir para parcelas vira patrimônio investido.
      c4MonthlyInvestment = monthlyBudget
      c4Portfolio += c4MonthlyInvestment
      c4TotalPaid += c4MonthlyInvestment
    } else {
      c4Interest = c4Balance * monthlyFinRate
      c4ScheduledPrincipal = Math.min(sacPrincipal, c4Balance)
      c4RegularPayment = c4ScheduledPrincipal + c4Interest
      const balanceAfterScheduledPrincipal = Math.max(0, c4Balance - c4ScheduledPrincipal)
      const monthlySurplus = Math.max(0, monthlyBudget - c4RegularPayment)
      c4ExtraAmortization = Math.min(monthlySurplus, balanceAfterScheduledPrincipal)
      c4MonthlyInvestment = Math.max(0, monthlySurplus - c4ExtraAmortization)

      c4Balance = Math.max(0, balanceAfterScheduledPrincipal - c4ExtraAmortization)
      c4Portfolio += c4MonthlyInvestment
      c4TotalPaid += c4RegularPayment + c4ExtraAmortization + c4MonthlyInvestment

      if (c4Balance === 0 && c4PaidOffMonth === null) {
        c4PaidOffMonth = month
      }
    }

    c4PropertyValue *= 1 + monthlyAppRate
    const c4Wealth = c4PropertyValue - c4Balance + c4Portfolio

    breakdown.push({
      month,
      rentInvest: c1Portfolio,
      financeInvest: c2PropertyValue - c2Balance + c2Portfolio,
      financeOnly: c3PropertyValue - c3Balance,
      financeAmortize: c4Wealth,
      rentInvestDetails: {
        correctedRent,
        monthlyInvestment: c1MonthlyInvest,
        portfolio: c1Portfolio,
        totalPaid: c1TotalPaid,
      },
      financeInvestDetails: {
        payment: c2Payment,
        interest: c2Interest,
        principal: c2Principal,
        monthlyInvestment: c2Surplus,
        propertyValue: c2PropertyValue,
        remainingDebt: c2Balance,
        portfolio: c2Portfolio,
        totalPaid: c2TotalPaid,
      },
      financeOnlyDetails: {
        payment: c3Payment,
        interest: c3Interest,
        principal: c3Principal,
        propertyValue: c3PropertyValue,
        remainingDebt: c3Balance,
        totalPaid: c3TotalPaid,
      },
      financeAmortizeDetails: {
        regularPayment: c4RegularPayment,
        interest: c4Interest,
        scheduledPrincipal: c4ScheduledPrincipal,
        extraAmortization: c4ExtraAmortization,
        monthlyInvestment: c4MonthlyInvestment,
        propertyValue: c4PropertyValue,
        remainingDebt: c4Balance,
        portfolio: c4Portfolio,
        totalPaid: c4TotalPaid,
        paidOff: c4Balance === 0,
      },
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
        finalWealth: c4PropertyValue - c4Balance + c4Portfolio,
        propertyValue: c4PropertyValue,
        remainingDebt: c4Balance,
        portfolio: c4Portfolio,
        totalPaid: c4TotalPaid,
        paidOffMonth: c4PaidOffMonth,
      },
    },
    breakdown,
    totalMonths,
  }
}
