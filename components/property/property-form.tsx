"use client"

import { useMemo, useState } from "react"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AdBanner } from "@/components/ads/ad-banner"
import { ScenarioCards } from "@/components/property/scenario-cards"
import { ScenarioChart } from "@/components/property/scenario-chart"
import { ScenarioTable } from "@/components/property/scenario-table"
import { calculatePropertyScenarios } from "@/lib/property-calculator"

interface FormValues {
  propertyPrice: string
  downPaymentPct: string
  financingYears: string
  financingRate: string
  investmentRate: string
  monthlyRent: string
  appreciationRate: string
  monthlyBudget: string
}

interface FormErrors {
  propertyPrice?: string
  downPaymentPct?: string
  financingYears?: string
  financingRate?: string
  investmentRate?: string
  monthlyRent?: string
  appreciationRate?: string
  monthlyBudget?: string
}

function parsePositive(value: string): number | null {
  const n = parseFloat(value.replace(",", "."))
  if (isNaN(n) || n < 0) return null
  return n
}

function parseStrictPositive(value: string): number | null {
  const n = parsePositive(value)
  if (n === null || n <= 0) return null
  return n
}

function validate(v: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!parseStrictPositive(v.propertyPrice))
    errors.propertyPrice = "Informe um valor de imóvel válido"

  const dp = parsePositive(v.downPaymentPct)
  if (dp === null || dp < 0 || dp >= 100)
    errors.downPaymentPct = "Entrada entre 0% e 99%"

  const fy = parsePositive(v.financingYears)
  if (!fy || !Number.isInteger(fy) || fy < 1 || fy > 35)
    errors.financingYears = "Prazo entre 1 e 35 anos"

  const fr = parseStrictPositive(v.financingRate)
  if (!fr || fr > 100)
    errors.financingRate = "Taxa entre 0,01% e 100% a.a."

  const ir = parseStrictPositive(v.investmentRate)
  if (!ir || ir > 100)
    errors.investmentRate = "Taxa entre 0,01% e 100% a.a."

  if (!parseStrictPositive(v.monthlyRent))
    errors.monthlyRent = "Informe um valor de aluguel válido"

  const ar = parsePositive(v.appreciationRate)
  if (ar === null || ar > 100)
    errors.appreciationRate = "Valorização entre 0% e 100% a.a."

  if (!parseStrictPositive(v.monthlyBudget))
    errors.monthlyBudget = "Informe um orçamento mensal válido"

  return errors
}

export function PropertyForm() {
  const [values, setValues] = useState<FormValues>({
    propertyPrice: "500000",
    downPaymentPct: "20",
    financingYears: "30",
    financingRate: "10",
    investmentRate: "12",
    monthlyRent: "2000",
    appreciationRate: "4",
    monthlyBudget: "4500",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    if (!submitted) return null
    const errs = validate(values)
    if (Object.keys(errs).length > 0) return null
    return calculatePropertyScenarios({
      propertyPrice: parseStrictPositive(values.propertyPrice)!,
      downPaymentPct: parsePositive(values.downPaymentPct)!,
      financingYears: parsePositive(values.financingYears)!,
      financingRate: parseStrictPositive(values.financingRate)!,
      investmentRate: parseStrictPositive(values.investmentRate)!,
      monthlyRent: parseStrictPositive(values.monthlyRent)!,
      appreciationRate: parsePositive(values.appreciationRate)!,
      monthlyBudget: parseStrictPositive(values.monthlyBudget)!,
    })
  }, [submitted, values])

  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (submitted) setSubmitted(false)
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleCalculate() {
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length === 0) setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Home className="size-5" />
            Comprar ou Alugar?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare 4 estratégias financeiras e veja qual constrói mais patrimônio ao longo do tempo.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="propertyPrice"
              label="Valor do Imóvel (R$)"
              value={values.propertyPrice}
              error={errors.propertyPrice}
              onChange={(v) => handleChange("propertyPrice", v)}
            />
            <Field
              id="downPaymentPct"
              label="Entrada (%)"
              value={values.downPaymentPct}
              error={errors.downPaymentPct}
              onChange={(v) => handleChange("downPaymentPct", v)}
              hint="Percentual do valor do imóvel"
            />
            <Field
              id="financingYears"
              label="Prazo do Financiamento (anos)"
              value={values.financingYears}
              error={errors.financingYears}
              onChange={(v) => handleChange("financingYears", v)}
              hint="Máximo: 35 anos"
              inputMode="numeric"
            />
            <Field
              id="financingRate"
              label="Taxa do Financiamento (% a.a.)"
              value={values.financingRate}
              error={errors.financingRate}
              onChange={(v) => handleChange("financingRate", v)}
            />
            <Field
              id="monthlyRent"
              label="Valor do Aluguel (R$/mês)"
              value={values.monthlyRent}
              error={errors.monthlyRent}
              onChange={(v) => handleChange("monthlyRent", v)}
            />
            <Field
              id="monthlyBudget"
              label="Orçamento Mensal Total (R$)"
              value={values.monthlyBudget}
              error={errors.monthlyBudget}
              onChange={(v) => handleChange("monthlyBudget", v)}
              hint="Valor disponível por mês para moradia + investimento"
            />
            <Field
              id="investmentRate"
              label="Rendimento das Aplicações (% a.a.)"
              value={values.investmentRate}
              error={errors.investmentRate}
              onChange={(v) => handleChange("investmentRate", v)}
            />
            <Field
              id="appreciationRate"
              label="Valorização do Imóvel (% a.a.)"
              value={values.appreciationRate}
              error={errors.appreciationRate}
              onChange={(v) => handleChange("appreciationRate", v)}
            />
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            Comparar Cenários
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <AdBanner slot="mid" />
          <ScenarioCards scenarios={result.scenarios} />
          <Separator />
          <ScenarioChart breakdown={result.breakdown} totalMonths={result.totalMonths} />
          <ScenarioTable breakdown={result.breakdown} />
        </>
      )}
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  error?: string
  hint?: string
  onChange: (v: string) => void
  inputMode?: "decimal" | "numeric"
}

function Field({ id, label, value, error, hint, onChange, inputMode = "decimal" }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode={inputMode}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
