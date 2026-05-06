// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────────────────

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPct(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",") + "%"
}

function pct(value: number): number {
  return value / 100
}

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Main comparison engine (/comparacao route) ────────────────────────────────
// Types prefixed with nothing — these are the detailed/extended versions.
// ─────────────────────────────────────────────────────────────────────────────

export type AmortizationSystem = "SAC" | "Price"

export interface GeneralInputs {
  assetValue: number
  monthlyIncome: number
  availableCash: number
  needsImmediately: boolean
  maxIncomePercent: number
  annualAssetAppreciation: number
}

export interface DetailedConsortiumInputs {
  creditValue: number
  termMonths: number
  adminFeePercent: number
  reserveFundPercent: number
  monthlyInsurance: number
  adhesionFee: number
  annualAdjustmentPercent: number
  ownBid: number
  embeddedBid: number
  contemplationMonth: number
  documentCosts: number
  appraisalCosts: number
  registryCosts: number
  otherCosts: number
  latePenaltyPercent: number
  lateInterestMonthlyPercent: number
  lateMonths: number
}

export interface DetailedFinancingInputs {
  assetValue: number
  downPayment: number
  termMonths: number
  monthlyRatePercent: number
  amortizationSystem: AmortizationSystem
  iofPercent: number
  registrationFee: number
  monthlyInsurance: number
  mortgageInsurance: number
  appraisalCost: number
  contractRegistration: number
  notaryCost: number
  itbi: number
  dispatcherCost: number
  otherCosts: number
  annualIndexerPercent: number
  latePenaltyPercent: number
  lateInterestMonthlyPercent: number
  lateMonths: number
  earlyPaymentAmount: number
  earlyPaymentMonth: number
}

export interface ConsortiumRow {
  month: number
  installment: number
  cumulativePaid: number
}

export interface FinancingRow {
  month: number
  installment: number
  cumulativePaid: number
  balance: number
  interest: number
  amortization: number
}

export interface ComparisonRow {
  month: number
  consortiumInstallment: number
  consortiumCumulativePaid: number
  consortiumDiffVsCredit: number
  consortiumDiffPctVsCredit: number
  financingInstallment: number
  financingCumulativePaid: number
  financingBalance: number
  financingDiffVsFinanced: number
  financingDiffPctVsFinanced: number
  accumulatedDiff: number
  better: "Consórcio" | "Financiamento" | "Empate"
}

export interface ConsortiumResults {
  firstInstallment: number
  lastInstallment: number
  totalInstallmentsPaid: number
  totalAdminFee: number
  totalReserveFund: number
  totalInsurance: number
  totalExtraCosts: number
  liquidCredit: number
  complement: number
  totalCost: number
  percentAboveCredit: number
  estimatedUseMonth: number
  rows: ConsortiumRow[]
}

export interface FinancingResults {
  downPayment: number
  financedValue: number
  firstInstallment: number
  lastInstallment: number
  totalInstallmentsPaid: number
  totalInterest: number
  totalInsurance: number
  totalIOF: number
  totalFees: number
  totalCost: number
  percentAboveFinanced: number
  finalBalance: number
  rows: FinancingRow[]
}

export interface Alert {
  type: "warning" | "info"
  message: string
}

export interface ComparacaoResult {
  consortium: ConsortiumResults
  financing: FinancingResults
  totalCostDiff: number
  betterTotalCost: "Consórcio" | "Financiamento" | "Empate"
  betterFirstInstallment: "Consórcio" | "Financiamento" | "Empate"
  consortiumInitialCash: number
  financingInitialCash: number
  consortiumIncomePercent: number
  financingIncomePercent: number
  breakEvenMonth: number | null
  conclusion: string
  rows: ComparisonRow[]
  alerts: Alert[]
}

function calcDetailedConsortium(
  inputs: DetailedConsortiumInputs,
  general: GeneralInputs
): ConsortiumResults {
  const {
    creditValue,
    termMonths,
    adminFeePercent,
    reserveFundPercent,
    monthlyInsurance,
    adhesionFee,
    annualAdjustmentPercent,
    ownBid,
    embeddedBid,
    contemplationMonth,
    documentCosts,
    appraisalCosts,
    registryCosts,
    otherCosts,
    latePenaltyPercent,
    lateInterestMonthlyPercent,
    lateMonths,
  } = inputs

  const commonFundMonthly = creditValue / termMonths
  const adminFeeMonthly = (creditValue * adminFeePercent) / 100 / termMonths
  const reserveMonthly = (creditValue * reserveFundPercent) / 100 / termMonths
  const baseInstallmentCore = commonFundMonthly + adminFeeMonthly + reserveMonthly

  const rows: ConsortiumRow[] = []
  let cumulativePaid = 0
  let totalAdminFee = 0
  let totalReserveFund = 0
  let totalInsurance = 0
  let firstInstallment = 0
  let lastInstallment = 0

  const month1Extras = ownBid + adhesionFee
  const contemplationExtras = documentCosts + appraisalCosts + registryCosts + otherCosts
  const safeContemplationMonth = Math.min(Math.max(1, contemplationMonth), termMonths)

  for (let month = 1; month <= termMonths; month++) {
    const yearsPassed = Math.floor((month - 1) / 12)
    const adj = Math.pow(1 + annualAdjustmentPercent / 100, yearsPassed)
    const installment = baseInstallmentCore * adj + monthlyInsurance

    let extras = 0
    if (month === 1) extras += month1Extras
    if (month === safeContemplationMonth && safeContemplationMonth !== 1) {
      extras += contemplationExtras
    } else if (month === 1 && safeContemplationMonth === 1) {
      extras += contemplationExtras
    }

    cumulativePaid += installment + extras
    totalAdminFee += adminFeeMonthly * adj
    totalReserveFund += reserveMonthly * adj
    totalInsurance += monthlyInsurance

    if (month === 1) firstInstallment = installment
    if (month === termMonths) lastInstallment = installment

    rows.push({ month, installment, cumulativePaid })
  }

  const avgInstallment = rows.reduce((s, r) => s + r.installment, 0) / termMonths
  const lateCost =
    lateMonths > 0
      ? avgInstallment *
        lateMonths *
        (latePenaltyPercent / 100 + (lateInterestMonthlyPercent / 100) * lateMonths)
      : 0

  const totalInstallmentsPaid = rows.reduce((s, r) => s + r.installment, 0)
  const totalExtraCosts = month1Extras + contemplationExtras + lateCost
  const totalCost = totalInstallmentsPaid + totalExtraCosts
  const liquidCredit = creditValue - embeddedBid
  const complement = Math.max(0, general.assetValue - liquidCredit)
  const percentAboveCredit =
    creditValue > 0 ? ((totalCost - creditValue) / creditValue) * 100 : 0

  return {
    firstInstallment,
    lastInstallment,
    totalInstallmentsPaid,
    totalAdminFee,
    totalReserveFund,
    totalInsurance,
    totalExtraCosts,
    liquidCredit,
    complement,
    totalCost,
    percentAboveCredit,
    estimatedUseMonth: safeContemplationMonth,
    rows,
  }
}

function calcDetailedFinancing(
  inputs: DetailedFinancingInputs,
  _general: GeneralInputs
): FinancingResults {
  const {
    assetValue,
    downPayment,
    termMonths,
    monthlyRatePercent,
    amortizationSystem,
    iofPercent,
    registrationFee,
    monthlyInsurance,
    mortgageInsurance,
    appraisalCost,
    contractRegistration,
    notaryCost,
    itbi,
    dispatcherCost,
    otherCosts,
    annualIndexerPercent,
    latePenaltyPercent,
    lateInterestMonthlyPercent,
    lateMonths,
    earlyPaymentAmount,
    earlyPaymentMonth,
  } = inputs

  const financedValue = Math.max(0, assetValue - downPayment)
  const monthlyRate = monthlyRatePercent / 100
  const iofTotal = financedValue * (iofPercent / 100)
  const upfrontFees =
    registrationFee +
    appraisalCost +
    contractRegistration +
    notaryCost +
    itbi +
    dispatcherCost +
    otherCosts

  const rows: FinancingRow[] = []
  let balance = financedValue
  let totalInstallmentsPaid = 0
  let totalInterest = 0
  let totalInsurance = 0
  let firstInstallment = 0
  let lastInstallment = 0

  let pmt = 0
  if (amortizationSystem === "Price" && monthlyRate > 0 && termMonths > 0) {
    const factor = Math.pow(1 + monthlyRate, termMonths)
    pmt = (financedValue * monthlyRate * factor) / (factor - 1)
  } else if (amortizationSystem === "Price") {
    pmt = financedValue / termMonths
  }

  for (let month = 1; month <= termMonths; month++) {
    if (earlyPaymentAmount > 0 && earlyPaymentMonth === month) {
      balance = Math.max(0, balance - earlyPaymentAmount)
      if (amortizationSystem === "Price") {
        const remaining = termMonths - month + 1
        if (remaining > 0 && monthlyRate > 0) {
          const factor = Math.pow(1 + monthlyRate, remaining)
          pmt = (balance * monthlyRate * factor) / (factor - 1)
        } else if (remaining > 0) {
          pmt = balance / remaining
        }
      }
    }

    let interest = 0
    let principalPayment = 0

    if (amortizationSystem === "SAC") {
      const amortization = financedValue / termMonths
      interest = balance * monthlyRate
      principalPayment = Math.min(amortization, balance)
    } else {
      interest = balance * monthlyRate
      const amortization = pmt - interest
      principalPayment = Math.min(Math.max(0, amortization), balance)
    }

    const coreInstallment =
      amortizationSystem === "SAC"
        ? principalPayment + interest
        : Math.max(interest, pmt)
    const monthlyExtras = monthlyInsurance + mortgageInsurance
    const totalMonthlyPayment = coreInstallment + monthlyExtras

    balance = Math.max(0, balance - principalPayment)
    totalInstallmentsPaid += totalMonthlyPayment
    totalInterest += interest
    totalInsurance += monthlyExtras

    if (month === 1) firstInstallment = totalMonthlyPayment
    if (month === termMonths) lastInstallment = totalMonthlyPayment

    rows.push({
      month,
      installment: totalMonthlyPayment,
      cumulativePaid: downPayment + totalInstallmentsPaid,
      balance,
      interest,
      amortization: principalPayment,
    })

    if (month % 12 === 0 && month < termMonths && annualIndexerPercent > 0) {
      balance *= 1 + annualIndexerPercent / 100
      if (amortizationSystem === "Price") {
        const remaining = termMonths - month
        if (remaining > 0 && monthlyRate > 0) {
          const factor = Math.pow(1 + monthlyRate, remaining)
          pmt = (balance * monthlyRate * factor) / (factor - 1)
        } else if (remaining > 0) {
          pmt = balance / remaining
        }
      }
    }
  }

  const avgInstallment = totalInstallmentsPaid / termMonths
  const lateCost =
    lateMonths > 0
      ? avgInstallment *
        lateMonths *
        (latePenaltyPercent / 100 + (lateInterestMonthlyPercent / 100) * lateMonths)
      : 0

  const totalFees = upfrontFees + lateCost
  const totalCost = downPayment + totalInstallmentsPaid + iofTotal + totalFees
  const percentAboveFinanced =
    financedValue > 0 ? ((totalCost - downPayment - financedValue) / financedValue) * 100 : 0

  return {
    downPayment,
    financedValue,
    firstInstallment,
    lastInstallment,
    totalInstallmentsPaid,
    totalInterest,
    totalInsurance,
    totalIOF: iofTotal,
    totalFees,
    totalCost,
    percentAboveFinanced,
    finalBalance: balance,
    rows,
  }
}

function buildComparisonRows(
  cRows: ConsortiumRow[],
  fRows: FinancingRow[],
  creditValue: number,
  financedValue: number
): ComparisonRow[] {
  const totalMonths = Math.max(cRows.length, fRows.length)
  const rows: ComparisonRow[] = []

  for (let i = 0; i < totalMonths; i++) {
    const month = i + 1
    const c = cRows[i]
    const f = fRows[i]

    const cInstallment = c?.installment ?? 0
    const cCumulative = c?.cumulativePaid ?? (cRows[cRows.length - 1]?.cumulativePaid ?? 0)
    const fInstallment = f?.installment ?? 0
    const fCumulative = f?.cumulativePaid ?? (fRows[fRows.length - 1]?.cumulativePaid ?? 0)
    const fBalance = f?.balance ?? 0

    const cDiff = cCumulative - creditValue
    const cDiffPct = creditValue > 0 ? (cDiff / creditValue) * 100 : 0
    const fDiff = fCumulative - financedValue
    const fDiffPct = financedValue > 0 ? (fDiff / financedValue) * 100 : 0
    const accDiff = fCumulative - cCumulative

    let better: "Consórcio" | "Financiamento" | "Empate"
    if (Math.abs(accDiff) < 0.01) better = "Empate"
    else if (accDiff > 0) better = "Consórcio"
    else better = "Financiamento"

    rows.push({
      month,
      consortiumInstallment: cInstallment,
      consortiumCumulativePaid: cCumulative,
      consortiumDiffVsCredit: cDiff,
      consortiumDiffPctVsCredit: cDiffPct,
      financingInstallment: fInstallment,
      financingCumulativePaid: fCumulative,
      financingBalance: fBalance,
      financingDiffVsFinanced: fDiff,
      financingDiffPctVsFinanced: fDiffPct,
      accumulatedDiff: accDiff,
      better,
    })
  }

  return rows
}

function findDetailedBreakEven(rows: ComparisonRow[]): number | null {
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].accumulatedDiff
    const curr = rows[i].accumulatedDiff
    if (prev !== 0 && curr !== 0 && prev * curr < 0) return rows[i].month
  }
  return null
}

function generateDetailedAlerts(
  general: GeneralInputs,
  consortium: ConsortiumResults,
  financing: FinancingResults,
  consortiumInputs: DetailedConsortiumInputs
): Alert[] {
  const alerts: Alert[] = []
  const { monthlyIncome, maxIncomePercent, availableCash, needsImmediately } = general

  if (monthlyIncome > 0) {
    const cPct = (consortium.firstInstallment / monthlyIncome) * 100
    const fPct = (financing.firstInstallment / monthlyIncome) * 100
    if (cPct > maxIncomePercent) {
      alerts.push({
        type: "warning",
        message: `A parcela inicial do consórcio (${cPct.toFixed(1)}% da renda) ultrapassa o limite de ${maxIncomePercent}% que você definiu.`,
      })
    }
    if (fPct > maxIncomePercent) {
      alerts.push({
        type: "warning",
        message: `A parcela inicial do financiamento (${fPct.toFixed(1)}% da renda) ultrapassa o limite de ${maxIncomePercent}% que você definiu.`,
      })
    }
  }

  if (financing.financedValue > 0 && financing.totalInterest / financing.financedValue > 1) {
    alerts.push({
      type: "warning",
      message: `Os juros totais do financiamento (${formatBRL(financing.totalInterest)}) superam o próprio valor financiado — você pagará mais que o dobro em juros.`,
    })
  }

  if (consortium.liquidCredit < general.assetValue) {
    alerts.push({
      type: "warning",
      message: `O crédito líquido do consórcio (${formatBRL(consortium.liquidCredit)}) não cobre o valor do bem. Será necessário um complemento de ${formatBRL(consortium.complement)}.`,
    })
  }

  if (
    consortiumInputs.embeddedBid > 0 &&
    consortiumInputs.creditValue > 0 &&
    consortiumInputs.embeddedBid > consortiumInputs.creditValue * 0.3
  ) {
    alerts.push({
      type: "warning",
      message: `O lance embutido representa mais de 30% da carta de crédito, reduzindo significativamente o crédito líquido disponível.`,
    })
  }

  if (consortiumInputs.termMonths > 240 || financing.rows.length > 240) {
    alerts.push({
      type: "warning",
      message: `O prazo é muito longo (mais de 20 anos), o que amplia muito o risco de inadimplência, reajustes e variações econômicas.`,
    })
  }

  if (needsImmediately && consortiumInputs.contemplationMonth > 1) {
    alerts.push({
      type: "warning",
      message: `Você indicou que precisa do bem imediatamente, mas o consórcio estima a contemplação apenas no mês ${consortiumInputs.contemplationMonth}. O financiamento entrega o bem na assinatura.`,
    })
  }

  const consortiumInitialCash = consortiumInputs.ownBid + consortiumInputs.adhesionFee
  if (availableCash > 0 && availableCash < consortiumInitialCash) {
    alerts.push({
      type: "warning",
      message: `O valor disponível (${formatBRL(availableCash)}) pode não cobrir os custos iniciais do consórcio (lance + adesão: ${formatBRL(consortiumInitialCash)}).`,
    })
  }

  if (availableCash > 0 && availableCash < financing.downPayment) {
    alerts.push({
      type: "warning",
      message: `O valor disponível (${formatBRL(availableCash)}) é menor que a entrada do financiamento (${formatBRL(financing.downPayment)}).`,
    })
  }

  if (consortiumInputs.annualAdjustmentPercent > 0) {
    alerts.push({
      type: "info",
      message: `O reajuste anual de ${consortiumInputs.annualAdjustmentPercent}% ao ano no consórcio eleva as parcelas progressivamente.`,
    })
  }

  if (financing.totalFees > financing.financedValue * 0.05) {
    alerts.push({
      type: "info",
      message: `As tarifas e custos extras do financiamento somam ${formatBRL(financing.totalFees)}, o que representa uma parcela relevante do custo total.`,
    })
  }

  return alerts
}

function generateDetailedConclusion(
  general: GeneralInputs,
  consortium: ConsortiumResults,
  financing: FinancingResults,
  breakEvenMonth: number | null
): string {
  const cCost = consortium.totalCost
  const fCost = financing.totalCost
  const diff = Math.abs(fCost - cCost)
  const cheaper = cCost < fCost ? "Consórcio" : fCost < cCost ? "Financiamento" : null

  let text = ""

  if (cheaper === "Consórcio") {
    text += `Pelo custo total estimado, o consórcio fica ${formatBRL(diff)} mais barato que o financiamento. `
    text += `Porém, ele depende de contemplação e pode exigir lance. `
    if (general.needsImmediately) {
      text += `Como você precisa do bem agora, o financiamento pode ser mais adequado, mesmo sendo mais caro. `
    }
  } else if (cheaper === "Financiamento") {
    text += `Pelo custo total estimado, o financiamento fica ${formatBRL(diff)} mais barato que o consórcio. `
    text += `Além disso, o financiamento permite usar o bem imediatamente. `
  } else {
    text += `As duas opções têm custo total estimado muito próximo. `
    if (general.needsImmediately) {
      text += `Como você precisa do bem agora, o financiamento leva vantagem por entregar o bem na contratação. `
    }
  }

  text += `\n\nNo consórcio, a carta é de ${formatBRL(consortium.liquidCredit)} e o custo total estimado será de ${formatBRL(cCost)}. `
  text += `Isso representa ${formatBRL(cCost - consortium.liquidCredit)} a mais, ou ${consortium.percentAboveCredit.toFixed(2)}% acima da carta de crédito. `
  text += `\n\nNo financiamento, você pegou ${formatBRL(financing.financedValue)} e pagará ${formatBRL(fCost)} ao final. `
  text += `Isso representa ${formatBRL(fCost - financing.downPayment - financing.financedValue)} a mais, ou ${financing.percentAboveFinanced.toFixed(2)}% acima do valor financiado.`

  if (breakEvenMonth !== null) {
    text += ` \n\nO ponto de equilíbrio ocorre no mês ${breakEvenMonth}, quando os totais pagos se cruzam.`
  } else {
    text += ` \n\nNão há ponto de equilíbrio nos prazos simulados — uma opção se mantém mais barata durante todo o período.`
  }

  return text
}

export function calculateComparison(
  general: GeneralInputs,
  consortiumInputs: DetailedConsortiumInputs,
  financingInputs: DetailedFinancingInputs
): ComparacaoResult {
  const consortium = calcDetailedConsortium(consortiumInputs, general)
  const financing = calcDetailedFinancing(financingInputs, general)

  const totalMonths = Math.max(consortiumInputs.termMonths, financingInputs.termMonths)
  const cRows = [...consortium.rows]
  const fRows = [...financing.rows]

  while (cRows.length < totalMonths) {
    const last = cRows[cRows.length - 1]
    cRows.push({ month: last.month + 1, installment: 0, cumulativePaid: last.cumulativePaid })
  }
  while (fRows.length < totalMonths) {
    const last = fRows[fRows.length - 1]
    fRows.push({
      month: last.month + 1,
      installment: 0,
      cumulativePaid: last.cumulativePaid,
      balance: last.balance,
      interest: 0,
      amortization: 0,
    })
  }

  const rows = buildComparisonRows(cRows, fRows, consortiumInputs.creditValue, financing.financedValue)
  const breakEvenMonth = findDetailedBreakEven(rows)
  const totalCostDiff = financing.totalCost - consortium.totalCost

  let betterTotalCost: "Consórcio" | "Financiamento" | "Empate"
  if (Math.abs(totalCostDiff) < 1) betterTotalCost = "Empate"
  else if (totalCostDiff > 0) betterTotalCost = "Consórcio"
  else betterTotalCost = "Financiamento"

  let betterFirstInstallment: "Consórcio" | "Financiamento" | "Empate"
  const installmentDiff = consortium.firstInstallment - financing.firstInstallment
  if (Math.abs(installmentDiff) < 0.01) betterFirstInstallment = "Empate"
  else if (installmentDiff < 0) betterFirstInstallment = "Consórcio"
  else betterFirstInstallment = "Financiamento"

  const consortiumInitialCash = consortiumInputs.ownBid + consortiumInputs.adhesionFee
  const financingInitialCash = financing.downPayment + financing.totalIOF + financing.totalFees
  const consortiumIncomePercent =
    general.monthlyIncome > 0 ? (consortium.firstInstallment / general.monthlyIncome) * 100 : 0
  const financingIncomePercent =
    general.monthlyIncome > 0 ? (financing.firstInstallment / general.monthlyIncome) * 100 : 0

  const conclusion = generateDetailedConclusion(general, consortium, financing, breakEvenMonth)
  const alerts = generateDetailedAlerts(general, consortium, financing, consortiumInputs)

  return {
    consortium,
    financing,
    totalCostDiff,
    betterTotalCost,
    betterFirstInstallment,
    consortiumInitialCash,
    financingInitialCash,
    consortiumIncomePercent,
    financingIncomePercent,
    breakEvenMonth,
    conclusion,
    rows,
    alerts,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── consortium-financing-comparison engine (/consortium-financing-comparison) ─
// ─────────────────────────────────────────────────────────────────────────────

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
