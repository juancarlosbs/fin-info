"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Calculator } from "lucide-react"
import { AdBanner } from "@/components/ads/ad-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ComparisonAlerts } from "@/components/consortium-financing/comparison-alerts"
import { ComparisonCharts } from "@/components/consortium-financing/comparison-charts"
import { ComparisonSummary } from "@/components/consortium-financing/comparison-summary"
import { ComparisonTable } from "@/components/consortium-financing/comparison-table"
import { CopyableFinalSummary } from "@/components/consortium-financing/copyable-final-summary"
import {
  calculateConsortiumFinancingComparison,
  type ComparisonInputs,
  type FinancingSystem,
} from "@/lib/consortium-financing"

type FormValues = Record<string, string>
type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  assetValue: "300000",
  termMonths: "180",
  monthlyIncome: "12000",
  availableToday: "70000",
  needsAssetImmediately: "yes",
  maxIncomeCommitmentPct: "30",
  annualAssetAdjustmentPct: "4",
  consortiumCreditValue: "300000",
  consortiumTermMonths: "180",
  administrationFeePct: "18",
  reserveFundPct: "2",
  consortiumMonthlyInsurance: "50",
  ownBid: "50000",
  embeddedBidPct: "10",
  estimatedContemplationMonth: "24",
  consortiumExtraCosts: "2500",
  consortiumLateMonths: "0",
  consortiumLateFeePct: "2",
  downPayment: "60000",
  financedAmount: "240000",
  financingTermMonths: "180",
  monthlyInterestPct: "0.95",
  financingSystem: "sac",
  iofPct: "0.38",
  financingMonthlyInsurance: "120",
  monthlyFees: "35",
  financingExtraCosts: "4500",
  indexerAnnualPct: "0",
  financingLateMonths: "0",
  financingLateFeePct: "2",
  earlyAmortizationMonth: "36",
  earlyAmortizationAmount: "10000",
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const num = Number.parseFloat(normalized)
  if (!Number.isFinite(num) || num < 0) return null
  return num
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const requiredPositive = [
    "assetValue", "termMonths", "monthlyIncome", "maxIncomeCommitmentPct", "consortiumCreditValue",
    "consortiumTermMonths", "estimatedContemplationMonth", "financedAmount", "financingTermMonths",
  ]
  for (const field of requiredPositive) {
    const value = parseNumber(values[field])
    if (values[field] === "" || value === null || value <= 0) errors[field] = "Informe um valor maior que zero"
  }

  const nonNegative = Object.keys(values).filter((field) => !["needsAssetImmediately", "financingSystem", ...requiredPositive].includes(field))
  for (const field of nonNegative) {
    const value = parseNumber(values[field])
    if (values[field] === "" || value === null) errors[field] = "Informe um valor válido (pode ser 0)"
  }

  const term = parseNumber(values.termMonths) ?? 0
  const consortiumTerm = parseNumber(values.consortiumTermMonths) ?? 0
  const financingTerm = parseNumber(values.financingTermMonths) ?? 0
  const contemplation = parseNumber(values.estimatedContemplationMonth) ?? 0
  const earlyMonth = parseNumber(values.earlyAmortizationMonth) ?? 0

  if (!Number.isInteger(term) || term > 600) errors.termMonths = "Informe prazo inteiro entre 1 e 600 meses"
  if (!Number.isInteger(consortiumTerm) || consortiumTerm > 600) errors.consortiumTermMonths = "Informe prazo inteiro entre 1 e 600 meses"
  if (!Number.isInteger(financingTerm) || financingTerm > 600) errors.financingTermMonths = "Informe prazo inteiro entre 1 e 600 meses"
  if (!Number.isInteger(contemplation) || contemplation > consortiumTerm) errors.estimatedContemplationMonth = "Mês inteiro dentro do prazo do consórcio"
  if (!Number.isInteger(earlyMonth) || earlyMonth > financingTerm) errors.earlyAmortizationMonth = "Mês inteiro dentro do prazo do financiamento"

  for (const field of ["maxIncomeCommitmentPct", "annualAssetAdjustmentPct", "administrationFeePct", "reserveFundPct", "embeddedBidPct", "consortiumLateFeePct", "monthlyInterestPct", "iofPct", "indexerAnnualPct", "financingLateFeePct"]) {
    const value = parseNumber(values[field]) ?? 0
    if (value > 100) errors[field] = "Use percentual até 100%"
  }

  return errors
}

function toInputs(values: FormValues): ComparisonInputs {
  return {
    general: {
      assetValue: parseNumber(values.assetValue)!,
      termMonths: parseNumber(values.termMonths)!,
      monthlyIncome: parseNumber(values.monthlyIncome)!,
      availableToday: parseNumber(values.availableToday)!,
      needsAssetImmediately: values.needsAssetImmediately === "yes",
      maxIncomeCommitmentPct: parseNumber(values.maxIncomeCommitmentPct)!,
      annualAssetAdjustmentPct: parseNumber(values.annualAssetAdjustmentPct)!,
    },
    consortium: {
      creditValue: parseNumber(values.consortiumCreditValue)!,
      termMonths: parseNumber(values.consortiumTermMonths)!,
      administrationFeePct: parseNumber(values.administrationFeePct)!,
      reserveFundPct: parseNumber(values.reserveFundPct)!,
      monthlyInsurance: parseNumber(values.consortiumMonthlyInsurance)!,
      ownBid: parseNumber(values.ownBid)!,
      embeddedBidPct: parseNumber(values.embeddedBidPct)!,
      estimatedContemplationMonth: parseNumber(values.estimatedContemplationMonth)!,
      extraCosts: parseNumber(values.consortiumExtraCosts)!,
      lateMonths: parseNumber(values.consortiumLateMonths)!,
      lateFeePct: parseNumber(values.consortiumLateFeePct)!,
    },
    financing: {
      downPayment: parseNumber(values.downPayment)!,
      financedAmount: parseNumber(values.financedAmount)!,
      termMonths: parseNumber(values.financingTermMonths)!,
      monthlyInterestPct: parseNumber(values.monthlyInterestPct)!,
      system: values.financingSystem as FinancingSystem,
      iofPct: parseNumber(values.iofPct)!,
      monthlyInsurance: parseNumber(values.financingMonthlyInsurance)!,
      monthlyFees: parseNumber(values.monthlyFees)!,
      extraCosts: parseNumber(values.financingExtraCosts)!,
      indexerAnnualPct: parseNumber(values.indexerAnnualPct)!,
      lateMonths: parseNumber(values.financingLateMonths)!,
      lateFeePct: parseNumber(values.financingLateFeePct)!,
      earlyAmortization: {
        month: parseNumber(values.earlyAmortizationMonth)!,
        amount: parseNumber(values.earlyAmortizationAmount)!,
      },
    },
  }
}

interface FieldProps {
  id: string
  label: string
  values: FormValues
  errors: FormErrors
  onChange: (field: keyof FormValues, value: string) => void
  placeholder?: string
}

function Field({ id, label, values, errors, onChange, placeholder = "0,00" }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        value={values[id]}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  )
}

export function ComparisonForm() {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const result = useMemo(() => {
    if (!submitted) return null
    const errs = validate(values)
    if (Object.keys(errs).length > 0) return null
    return calculateConsortiumFinancingComparison(toInputs(values))
  }, [submitted, values])

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [result])

  function handleChange(field: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }))
    if (submitted) setSubmitted(false)
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  function handleCalculate() {
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length === 0) setSubmitted(true)
  }

  const fieldProps = { values, errors, onChange: handleChange }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="size-5" />
            Comparação Consórcio x Financiamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Dados gerais</h2>
              <p className="text-xs text-muted-foreground">Informe o valor do bem, sua renda e as premissas de reajuste.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="assetValue" label="Valor do bem (R$)" {...fieldProps} />
              <Field id="termMonths" label="Prazo em meses" {...fieldProps} placeholder="180" />
              <Field id="monthlyIncome" label="Renda mensal (R$)" {...fieldProps} />
              <Field id="availableToday" label="Valor disponível hoje (R$)" {...fieldProps} />
              <div className="space-y-1.5">
                <Label>Precisa do bem imediatamente?</Label>
                <Select value={values.needsAssetImmediately} onValueChange={(value) => handleChange("needsAssetImmediately", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field id="maxIncomeCommitmentPct" label="Percentual máximo da renda (%)" {...fieldProps} />
              <Field id="annualAssetAdjustmentPct" label="Reajuste anual estimado do bem (%)" {...fieldProps} />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Consórcio</h2>
              <p className="text-xs text-muted-foreground">Inclui fundo comum, taxa de administração, fundo de reserva, seguro, lances, crédito líquido, complemento, extras e atraso.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="consortiumCreditValue" label="Valor da carta (R$)" {...fieldProps} />
              <Field id="consortiumTermMonths" label="Prazo do consórcio (meses)" {...fieldProps} />
              <Field id="administrationFeePct" label="Taxa de administração total (%)" {...fieldProps} />
              <Field id="reserveFundPct" label="Fundo de reserva total (%)" {...fieldProps} />
              <Field id="consortiumMonthlyInsurance" label="Seguro mensal (R$)" {...fieldProps} />
              <Field id="ownBid" label="Lance próprio (R$)" {...fieldProps} />
              <Field id="embeddedBidPct" label="Lance embutido (% da carta)" {...fieldProps} />
              <Field id="estimatedContemplationMonth" label="Mês estimado de contemplação" {...fieldProps} />
              <Field id="consortiumExtraCosts" label="Custos extras (R$)" {...fieldProps} />
              <Field id="consortiumLateMonths" label="Meses em atraso" {...fieldProps} />
              <Field id="consortiumLateFeePct" label="Multa/juros de atraso (%)" {...fieldProps} />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Financiamento</h2>
              <p className="text-xs text-muted-foreground">Inclui entrada, SAC/Price, juros, IOF, seguros, tarifas, custos extras, indexador, atraso, amortização antecipada e saldo devedor mensal.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="downPayment" label="Entrada (R$)" {...fieldProps} />
              <Field id="financedAmount" label="Valor financiado (R$)" {...fieldProps} />
              <Field id="financingTermMonths" label="Prazo do financiamento (meses)" {...fieldProps} />
              <Field id="monthlyInterestPct" label="Juros mensal (%)" {...fieldProps} />
              <div className="space-y-1.5">
                <Label>Sistema de amortização</Label>
                <Select value={values.financingSystem} onValueChange={(value) => handleChange("financingSystem", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">SAC</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field id="iofPct" label="IOF (%)" {...fieldProps} />
              <Field id="financingMonthlyInsurance" label="Seguros mensais (R$)" {...fieldProps} />
              <Field id="monthlyFees" label="Tarifas mensais (R$)" {...fieldProps} />
              <Field id="financingExtraCosts" label="Custos extras (R$)" {...fieldProps} />
              <Field id="indexerAnnualPct" label="Indexador anual estimado (%)" {...fieldProps} />
              <Field id="financingLateMonths" label="Meses em atraso" {...fieldProps} />
              <Field id="financingLateFeePct" label="Multa/juros de atraso (%)" {...fieldProps} />
              <Field id="earlyAmortizationMonth" label="Mês da amortização antecipada" {...fieldProps} />
              <Field id="earlyAmortizationAmount" label="Valor da amortização antecipada (R$)" {...fieldProps} />
            </div>
          </section>

          <Button type="button" className="w-full" onClick={handleCalculate}>
            Calcular comparação
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div ref={resultsRef} className="space-y-6 scroll-mt-6">
          <ComparisonAlerts alerts={result.alerts} />
          <ComparisonSummary result={result} />
          <AdBanner slot="mid" />
          <ComparisonCharts result={result} />
          <ComparisonTable result={result} />
          <CopyableFinalSummary result={result} />
        </div>
      )}
    </div>
  )
}
