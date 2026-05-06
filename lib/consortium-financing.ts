export type FinancingSystem = "sac" | "price"
export type Urgency = "yes" | "no"

export interface GeneralComparisonInputs {
  assetValue: number
  termMonths: number
  monthlyIncome: number
  availableToday: number
  needsAssetImmediately: boolean
  maxIncomeCommitmentPct: number
  annualAssetAdjustmentPct: number
}

export interface ConsortiumInputs {
  creditValue: number
  termMonths: number
  administrationFeePct: number
  reserveFundPct: number
  monthlyInsurance: number
  ownBid: number
  embeddedBidPct: number
  estimatedContemplationMonth: number
  extraCosts: number
  lateMonths: number
  lateFeePct: number
}

export interface EarlyAmortizationInput {
  month: number
  amount: number
}

export interface FinancingInputs {
  downPayment: number
  financedAmount: number
  termMonths: number
  monthlyInterestPct: number
  system: FinancingSystem
  iofPct: number
  monthlyInsurance: number
  monthlyFees: number
  extraCosts: number
  indexerAnnualPct: number
  lateMonths: number
  lateFeePct: number
  earlyAmortization: EarlyAmortizationInput
}

export interface ComparisonInputs {
  general: GeneralComparisonInputs
  consortium: ConsortiumInputs
  financing: FinancingInputs
}

export interface ConsortiumMonthlyLine {
  month: number
  installment: number
  totalPaid: number
  assetReferenceValue: number
  differenceVsCredit: number
  differencePctVsCredit: number
  liquidCredit: number
  complementNeeded: number
}

export interface FinancingMonthlyLine {
  month: number
  installment: number
  totalPaid: number
  debtBalance: number
  differenceVsFinancedAmount: number
  differencePctVsFinancedAmount: number
  interest: number
  amortization: number
}

export interface ComparisonMonthlyLine {
  month: number
  consortiumInstallment: number
  consortiumTotalPaid: number
  consortiumDifferenceVsCredit: number
  consortiumDifferencePctVsCredit: number
  financingInstallment: number
  financingTotalPaid: number
  debtBalance: number
  financingDifferenceVsAmount: number
  financingDifferencePctVsAmount: number
  accumulatedDifference: number
  bestUntilMonth: "Consórcio" | "Financiamento" | "Empate"
  isConsortiumReferenceExceeded: boolean
  isFinancingReferenceExceeded: boolean
  isTurningPoint: boolean
}

export interface ConsortiumResult {
  totalCost: number
  initialCashNeeded: number
  firstInstallment: number
  maxInstallment: number
  liquidCredit: number
  complementNeeded: number
  monthlyLines: ConsortiumMonthlyLine[]
  referenceExceededMonth: number | null
  costComposition: { label: string; value: number }[]
}

export interface FinancingResult {
  totalCost: number
  initialCashNeeded: number
  firstInstallment: number
  maxInstallment: number
  monthlyLines: FinancingMonthlyLine[]
  referenceExceededMonth: number | null
  costComposition: { label: string; value: number }[]
}

export interface ComparisonResult {
  inputs: ComparisonInputs
  consortium: ConsortiumResult
  financing: FinancingResult
  monthlyLines: ComparisonMonthlyLine[]
  totalDifference: number
  totalDifferencePct: number
  bestByTotalCost: "Consórcio" | "Financiamento" | "Empate"
  lowestInitialInstallment: "Consórcio" | "Financiamento" | "Empate"
  bestForUrgency: "Consórcio" | "Financiamento"
  bestForWaiting: "Consórcio" | "Financiamento"
  breakEvenMonth: number | null
  incomeCommitment: {
    consortiumFirstPct: number
    consortiumMaxPct: number
    financingFirstPct: number
    financingMaxPct: number
  }
  alerts: string[]
}

function pct(value: number): number {
  return value / 100
}

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

function getAdjustedAssetValue(baseValue: number, annualAdjustmentPct: number, month: number): number {
  const yearsElapsed = Math.floor((month - 1) / 12)
  return baseValue * Math.pow(1 + pct(annualAdjustmentPct), yearsElapsed)
}

function calculateConsortium(general: GeneralComparisonInputs, input: ConsortiumInputs): ConsortiumResult {
  const term = Math.max(1, Math.floor(input.termMonths || general.termMonths))
  const baseCommonFund = input.creditValue / term
  const adminMonthly = (input.creditValue * pct(input.administrationFeePct)) / term
  const reserveMonthly = (input.creditValue * pct(input.reserveFundPct)) / term
  const embeddedBid = input.creditValue * pct(input.embeddedBidPct)
  const liquidCredit = Math.max(0, input.creditValue - embeddedBid)
  const contemplatedAssetValue = getAdjustedAssetValue(
    general.assetValue,
    general.annualAssetAdjustmentPct,
    input.estimatedContemplationMonth
  )
  const complementNeeded = Math.max(0, contemplatedAssetValue - liquidCredit)

  const monthlyLines: ConsortiumMonthlyLine[] = []
  let totalPaid = input.extraCosts + input.ownBid + complementNeeded
  let referenceExceededMonth: number | null = null
  let totalCommonFund = 0
  let totalAdmin = 0
  let totalReserve = 0
  let totalInsurance = 0
  let totalLateFees = 0

  for (let month = 1; month <= term; month++) {
    const adjustedCredit = getAdjustedAssetValue(input.creditValue, general.annualAssetAdjustmentPct, month)
    const adjustmentMultiplier = adjustedCredit / input.creditValue
    const commonFund = baseCommonFund * adjustmentMultiplier
    const admin = adminMonthly * adjustmentMultiplier
    const reserve = reserveMonthly * adjustmentMultiplier
    const lateFee = month <= input.lateMonths ? (commonFund + admin + reserve + input.monthlyInsurance) * pct(input.lateFeePct) : 0
    const installment = commonFund + admin + reserve + input.monthlyInsurance + lateFee

    totalCommonFund += commonFund
    totalAdmin += admin
    totalReserve += reserve
    totalInsurance += input.monthlyInsurance
    totalLateFees += lateFee
    totalPaid += installment

    const differenceVsCredit = totalPaid - adjustedCredit
    if (referenceExceededMonth === null && totalPaid >= adjustedCredit) referenceExceededMonth = month

    monthlyLines.push({
      month,
      installment: roundMoney(installment),
      totalPaid: roundMoney(totalPaid),
      assetReferenceValue: roundMoney(adjustedCredit),
      differenceVsCredit: roundMoney(differenceVsCredit),
      differencePctVsCredit: adjustedCredit > 0 ? differenceVsCredit / adjustedCredit : 0,
      liquidCredit: roundMoney(liquidCredit),
      complementNeeded: roundMoney(complementNeeded),
    })
  }

  return {
    totalCost: roundMoney(totalPaid),
    initialCashNeeded: roundMoney(input.ownBid + input.extraCosts + complementNeeded),
    firstInstallment: monthlyLines[0]?.installment ?? 0,
    maxInstallment: Math.max(...monthlyLines.map((line) => line.installment)),
    liquidCredit: roundMoney(liquidCredit),
    complementNeeded: roundMoney(complementNeeded),
    monthlyLines,
    referenceExceededMonth,
    costComposition: [
      { label: "Fundo comum", value: roundMoney(totalCommonFund) },
      { label: "Taxa adm.", value: roundMoney(totalAdmin) },
      { label: "Fundo reserva", value: roundMoney(totalReserve) },
      { label: "Seguro", value: roundMoney(totalInsurance) },
      { label: "Lances", value: roundMoney(input.ownBid) },
      { label: "Complemento", value: roundMoney(complementNeeded) },
      { label: "Extras/atraso", value: roundMoney(input.extraCosts + totalLateFees) },
    ],
  }
}

function calculateFinancing(input: FinancingInputs): FinancingResult {
  const term = Math.max(1, Math.floor(input.termMonths))
  const monthlyRate = pct(input.monthlyInterestPct)
  const monthlyIndexer = Math.pow(1 + pct(input.indexerAnnualPct), 1 / 12) - 1
  let balance = input.financedAmount * (1 + pct(input.iofPct))
  const originalFinancedWithIof = balance
  const fixedPriceInstallment = monthlyRate > 0
    ? (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
    : balance / term

  let totalPaid = input.downPayment + input.extraCosts
  let referenceExceededMonth: number | null = null
  let totalInterest = 0
  let totalInsurance = 0
  let totalFees = 0
  let totalLateFees = 0
  let totalAmortization = 0
  const monthlyLines: FinancingMonthlyLine[] = []

  for (let month = 1; month <= term; month++) {
    if (balance <= 0) {
      monthlyLines.push({
        month,
        installment: 0,
        totalPaid: roundMoney(totalPaid),
        debtBalance: 0,
        differenceVsFinancedAmount: roundMoney(totalPaid - input.financedAmount),
        differencePctVsFinancedAmount: input.financedAmount > 0 ? (totalPaid - input.financedAmount) / input.financedAmount : 0,
        interest: 0,
        amortization: 0,
      })
      continue
    }

    balance *= 1 + monthlyIndexer
    const interest = balance * monthlyRate
    const baseAmortization = input.system === "sac"
      ? originalFinancedWithIof / term
      : Math.max(0, fixedPriceInstallment - interest)
    const scheduledAmortization = Math.min(balance, baseAmortization)
    const earlyAmortization = month === input.earlyAmortization.month ? Math.min(balance - scheduledAmortization, input.earlyAmortization.amount) : 0
    const amortization = Math.max(0, scheduledAmortization + earlyAmortization)
    const lateFeeBase = interest + scheduledAmortization + input.monthlyInsurance + input.monthlyFees
    const lateFee = month <= input.lateMonths ? lateFeeBase * pct(input.lateFeePct) : 0
    const installment = interest + scheduledAmortization + earlyAmortization + input.monthlyInsurance + input.monthlyFees + lateFee

    balance = Math.max(0, balance + interest - amortization)
    totalPaid += installment
    totalInterest += interest
    totalInsurance += input.monthlyInsurance
    totalFees += input.monthlyFees
    totalLateFees += lateFee
    totalAmortization += earlyAmortization
    if (referenceExceededMonth === null && totalPaid >= input.financedAmount) referenceExceededMonth = month

    monthlyLines.push({
      month,
      installment: roundMoney(installment),
      totalPaid: roundMoney(totalPaid),
      debtBalance: roundMoney(balance),
      differenceVsFinancedAmount: roundMoney(totalPaid - input.financedAmount),
      differencePctVsFinancedAmount: input.financedAmount > 0 ? (totalPaid - input.financedAmount) / input.financedAmount : 0,
      interest: roundMoney(interest),
      amortization: roundMoney(scheduledAmortization + earlyAmortization),
    })
  }

  return {
    totalCost: roundMoney(totalPaid),
    initialCashNeeded: roundMoney(input.downPayment + input.extraCosts),
    firstInstallment: monthlyLines[0]?.installment ?? 0,
    maxInstallment: Math.max(...monthlyLines.map((line) => line.installment)),
    monthlyLines,
    referenceExceededMonth,
    costComposition: [
      { label: "Entrada", value: roundMoney(input.downPayment) },
      { label: "Principal/IOF", value: roundMoney(originalFinancedWithIof) },
      { label: "Juros", value: roundMoney(totalInterest) },
      { label: "Seguros", value: roundMoney(totalInsurance) },
      { label: "Tarifas", value: roundMoney(totalFees) },
      { label: "Amort. extra", value: roundMoney(totalAmortization) },
      { label: "Extras/atraso", value: roundMoney(input.extraCosts + totalLateFees) },
    ],
  }
}

function compareLabel(a: number, b: number): "Consórcio" | "Financiamento" | "Empate" {
  const diff = Math.abs(a - b)
  if (diff < 0.01) return "Empate"
  return a < b ? "Consórcio" : "Financiamento"
}

export function calculateConsortiumFinancingComparison(inputs: ComparisonInputs): ComparisonResult {
  const consortium = calculateConsortium(inputs.general, inputs.consortium)
  const financing = calculateFinancing(inputs.financing)
  const maxMonths = Math.max(consortium.monthlyLines.length, financing.monthlyLines.length)
  const monthlyLines: ComparisonMonthlyLine[] = []
  let breakEvenMonth: number | null = null
  let previousBest: "Consórcio" | "Financiamento" | "Empate" | null = null

  for (let i = 0; i < maxMonths; i++) {
    const month = i + 1
    const c = consortium.monthlyLines[i] ?? consortium.monthlyLines[consortium.monthlyLines.length - 1]
    const f = financing.monthlyLines[i] ?? financing.monthlyLines[financing.monthlyLines.length - 1]
    const accumulatedDifference = c.totalPaid - f.totalPaid
    const bestUntilMonth = compareLabel(c.totalPaid, f.totalPaid)
    const isTurningPoint = previousBest !== null && bestUntilMonth !== "Empate" && previousBest !== bestUntilMonth
    if (isTurningPoint && breakEvenMonth === null) breakEvenMonth = month
    if (bestUntilMonth !== "Empate") previousBest = bestUntilMonth

    monthlyLines.push({
      month,
      consortiumInstallment: c.month === month ? c.installment : 0,
      consortiumTotalPaid: c.totalPaid,
      consortiumDifferenceVsCredit: c.differenceVsCredit,
      consortiumDifferencePctVsCredit: c.differencePctVsCredit,
      financingInstallment: f.month === month ? f.installment : 0,
      financingTotalPaid: f.totalPaid,
      debtBalance: f.debtBalance,
      financingDifferenceVsAmount: f.differenceVsFinancedAmount,
      financingDifferencePctVsAmount: f.differencePctVsFinancedAmount,
      accumulatedDifference: roundMoney(accumulatedDifference),
      bestUntilMonth,
      isConsortiumReferenceExceeded: consortium.referenceExceededMonth === month,
      isFinancingReferenceExceeded: financing.referenceExceededMonth === month,
      isTurningPoint,
    })
  }

  const totalDifference = consortium.totalCost - financing.totalCost
  const totalDifferencePct = financing.totalCost > 0 ? totalDifference / financing.totalCost : 0
  const bestByTotalCost = compareLabel(consortium.totalCost, financing.totalCost)
  const lowestInitialInstallment = compareLabel(consortium.firstInstallment, financing.firstInstallment)
  const bestForUrgency = inputs.general.needsAssetImmediately ? "Financiamento" : bestByTotalCost === "Financiamento" ? "Financiamento" : "Consórcio"
  const bestForWaiting = bestByTotalCost === "Financiamento" ? "Financiamento" : "Consórcio"
  const income = inputs.general.monthlyIncome || 1
  const incomeCommitment = {
    consortiumFirstPct: consortium.firstInstallment / income,
    consortiumMaxPct: consortium.maxInstallment / income,
    financingFirstPct: financing.firstInstallment / income,
    financingMaxPct: financing.maxInstallment / income,
  }

  const alerts: string[] = []
  const maxCommitment = pct(inputs.general.maxIncomeCommitmentPct)
  if (inputs.general.needsAssetImmediately) alerts.push("Você informou necessidade imediata do bem; consórcio depende de contemplação e pode não atender à urgência.")
  if (incomeCommitment.consortiumMaxPct > maxCommitment) alerts.push("A maior parcela do consórcio ultrapassa o percentual máximo de renda informado.")
  if (incomeCommitment.financingMaxPct > maxCommitment) alerts.push("A maior parcela do financiamento ultrapassa o percentual máximo de renda informado.")
  if (inputs.general.availableToday < Math.min(consortium.initialCashNeeded, financing.initialCashNeeded)) alerts.push("O valor disponível hoje pode ser insuficiente para a opção com menor desembolso inicial.")
  if (inputs.consortium.embeddedBidPct > 0) alerts.push("O lance embutido reduz o crédito líquido e pode exigir complemento para comprar o bem.")
  if (inputs.financing.indexerAnnualPct > 0 || inputs.general.annualAssetAdjustmentPct > 0) alerts.push("Reajustes e indexadores são estimativas; variações reais podem alterar bastante o resultado.")
  if (breakEvenMonth) alerts.push(`Há ponto de virada estimado no mês ${breakEvenMonth}, quando a melhor opção acumulada muda.`)

  return {
    inputs,
    consortium,
    financing,
    monthlyLines,
    totalDifference: roundMoney(totalDifference),
    totalDifferencePct,
    bestByTotalCost,
    lowestInitialInstallment,
    bestForUrgency,
    bestForWaiting,
    breakEvenMonth,
    incomeCommitment,
    alerts,
  }
}
