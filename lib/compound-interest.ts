export type RateType = "monthly" | "annual"
export type PeriodType = "months" | "years"

export interface CalculatorInputs {
  initialValue: number
  monthlyContribution: number
  rate: number
  rateType: RateType
  period: number
  periodType: PeriodType
}

export interface MonthlyBreakdown {
  month: number
  contribution: number
  periodInterest: number
  totalInvested: number
  totalInterest: number
  balance: number
}

export interface CalculationResult {
  finalAmount: number
  totalInvested: number
  totalInterest: number
  returnRate: number
  breakdown: MonthlyBreakdown[]
}

export function calculateCompoundInterest(inputs: CalculatorInputs): CalculationResult {
  const { initialValue, monthlyContribution, rate, rateType, period, periodType } = inputs

  const totalMonths = periodType === "years" ? period * 12 : period

  const monthlyRate =
    rateType === "annual"
      ? Math.pow(1 + rate / 100, 1 / 12) - 1
      : rate / 100

  const breakdown: MonthlyBreakdown[] = []
  let balance = initialValue
  let totalInvested = initialValue

  for (let month = 1; month <= totalMonths; month++) {
    const prevBalance = balance
    balance = balance * (1 + monthlyRate) + monthlyContribution
    totalInvested += monthlyContribution
    const periodInterest = balance - prevBalance - monthlyContribution
    const totalInterest = balance - totalInvested

    breakdown.push({
      month,
      contribution: month === 1 ? initialValue + monthlyContribution : monthlyContribution,
      periodInterest,
      totalInvested,
      totalInterest,
      balance,
    })
  }

  const finalAmount = balance
  const totalInterest = finalAmount - totalInvested
  const returnRate = totalInvested > 0 ? totalInterest / totalInvested : 0

  return { finalAmount, totalInvested, totalInterest, returnRate, breakdown }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPct(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
