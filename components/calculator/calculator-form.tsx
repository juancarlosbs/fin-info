"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AdBanner } from "@/components/ads/ad-banner"
import { ResultsSummary } from "@/components/calculator/results-summary"
import { GrowthChart } from "@/components/calculator/growth-chart"
import { BreakdownTable } from "@/components/calculator/breakdown-table"
import {
  calculateCompoundInterest,
  type RateType,
  type PeriodType,
} from "@/lib/compound-interest"

interface FormValues {
  initialValue: string
  monthlyContribution: string
  rate: string
  period: string
}

interface FormErrors {
  initialValue?: string
  monthlyContribution?: string
  rate?: string
  period?: string
}

function parsePositiveNumber(value: string): number | null {
  const normalized = value.replace(",", ".")
  const num = parseFloat(normalized)
  if (isNaN(num) || num < 0) return null
  return num
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  const initial = parsePositiveNumber(values.initialValue)
  if (values.initialValue === "" || initial === null) {
    errors.initialValue = "Informe um valor inicial válido"
  }

  const contribution = parsePositiveNumber(values.monthlyContribution)
  if (values.monthlyContribution === "" || contribution === null) {
    errors.monthlyContribution = "Informe um valor de aporte (pode ser 0)"
  }

  const rate = parsePositiveNumber(values.rate)
  if (values.rate === "" || rate === null || rate <= 0 || rate > 100) {
    errors.rate = "Informe uma taxa entre 0,01% e 100%"
  }

  const period = parsePositiveNumber(values.period)
  if (values.period === "" || period === null || period <= 0 || !Number.isInteger(period) || period > 600) {
    errors.period = "Informe um período entre 1 e 600"
  }

  return errors
}

interface ToggleGroupProps {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}

function ToggleGroup({ value, onChange, options }: ToggleGroupProps) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            "flex-1 px-3 py-1.5 text-xs font-medium transition-colors " +
            (value === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted")
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function CalculatorForm() {
  const [values, setValues] = useState<FormValues>({
    initialValue: "1000",
    monthlyContribution: "500",
    rate: "10",
    period: "10",
  })
  const [rateType, setRateType] = useState<RateType>("annual")
  const [periodType, setPeriodType] = useState<PeriodType>("years")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    if (!submitted) return null
    const errs = validate(values)
    if (Object.keys(errs).length > 0) return null

    return calculateCompoundInterest({
      initialValue: parsePositiveNumber(values.initialValue)!,
      monthlyContribution: parsePositiveNumber(values.monthlyContribution)!,
      rate: parsePositiveNumber(values.rate)!,
      rateType,
      period: parsePositiveNumber(values.period)!,
      periodType,
    })
  }, [submitted, values, rateType, periodType])

  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (submitted) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setSubmitted(false)
    }
  }

  function handleCalculate() {
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setSubmitted(true)
    }
  }

  const periodMax = periodType === "years" ? 50 : 600

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="size-5" />
            Calculadora de Juros Compostos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Valor Inicial */}
            <div className="space-y-1.5">
              <Label htmlFor="initialValue">Valor Inicial (R$)</Label>
              <Input
                id="initialValue"
                inputMode="decimal"
                placeholder="0,00"
                value={values.initialValue}
                onChange={(e) => handleChange("initialValue", e.target.value)}
                aria-invalid={!!errors.initialValue}
              />
              {errors.initialValue && (
                <p className="text-xs text-destructive">{errors.initialValue}</p>
              )}
            </div>

            {/* Aporte Mensal */}
            <div className="space-y-1.5">
              <Label htmlFor="monthlyContribution">Aporte Mensal (R$)</Label>
              <Input
                id="monthlyContribution"
                inputMode="decimal"
                placeholder="0,00"
                value={values.monthlyContribution}
                onChange={(e) => handleChange("monthlyContribution", e.target.value)}
                aria-invalid={!!errors.monthlyContribution}
              />
              {errors.monthlyContribution && (
                <p className="text-xs text-destructive">{errors.monthlyContribution}</p>
              )}
            </div>

            {/* Taxa de Juros */}
            <div className="space-y-1.5">
              <Label htmlFor="rate">Taxa de Juros (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="rate"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={values.rate}
                  onChange={(e) => handleChange("rate", e.target.value)}
                  aria-invalid={!!errors.rate}
                  className="flex-1"
                />
                <ToggleGroup
                  value={rateType}
                  onChange={(v) => { setRateType(v as RateType); setSubmitted(false) }}
                  options={[
                    { label: "a.m.", value: "monthly" },
                    { label: "a.a.", value: "annual" },
                  ]}
                />
              </div>
              {errors.rate && (
                <p className="text-xs text-destructive">{errors.rate}</p>
              )}
            </div>

            {/* Período */}
            <div className="space-y-1.5">
              <Label htmlFor="period">Período</Label>
              <div className="flex gap-2">
                <Input
                  id="period"
                  inputMode="numeric"
                  placeholder={periodType === "years" ? "anos" : "meses"}
                  value={values.period}
                  onChange={(e) => handleChange("period", e.target.value)}
                  aria-invalid={!!errors.period}
                  className="flex-1"
                />
                <ToggleGroup
                  value={periodType}
                  onChange={(v) => { setPeriodType(v as PeriodType); setSubmitted(false) }}
                  options={[
                    { label: "Meses", value: "months" },
                    { label: "Anos", value: "years" },
                  ]}
                />
              </div>
              {errors.period && (
                <p className="text-xs text-destructive">{errors.period}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo: {periodMax} {periodType === "years" ? "anos" : "meses"}
              </p>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            Calcular
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <AdBanner slot="mid" />

          <ResultsSummary result={result} />

          <Separator />

          <GrowthChart result={result} />

          <BreakdownTable result={result} />
        </>
      )}
    </div>
  )
}
