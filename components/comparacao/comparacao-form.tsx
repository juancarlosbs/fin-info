"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AdBanner } from "@/components/ads/ad-banner"
import { ComparisonResults } from "@/components/comparacao/comparison-results"
import { ComparisonCharts } from "@/components/comparacao/comparison-charts"
import { ComparisonTable } from "@/components/comparacao/comparison-table"
import {
  calculateComparison,
  type AmortizationSystem,
} from "@/lib/consortium-financing"

// ── helpers ────────────────────────────────────────────────────────────────

function parse(v: string): number {
  const n = parseFloat(v.replace(",", "."))
  return isNaN(n) ? 0 : n
}

function parsePos(v: string): number | null {
  const n = parseFloat(v.replace(",", "."))
  return isNaN(n) || n < 0 ? null : n
}

// ── ToggleGroup ─────────────────────────────────────────────────────────────

interface ToggleGroupProps {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}

function ToggleGroup({ value, onChange, options }: ToggleGroupProps) {
  return (
    <div className="flex rounded-md border overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "flex-1 px-3 py-1.5 text-xs font-medium transition-colors " +
            (value === o.value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── field helpers ────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  placeholder = "0",
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── form state types ─────────────────────────────────────────────────────────

interface GeneralForm {
  assetValue: string
  monthlyIncome: string
  availableCash: string
  needsImmediately: boolean
  maxIncomePercent: string
  annualAssetAppreciation: string
}

interface ConsortiumForm {
  creditValue: string
  termMonths: string
  adminFeePercent: string
  reserveFundPercent: string
  monthlyInsurance: string
  adhesionFee: string
  annualAdjustmentPercent: string
  ownBid: string
  embeddedBid: string
  contemplationMonth: string
  documentCosts: string
  appraisalCosts: string
  registryCosts: string
  otherCosts: string
  latePenaltyPercent: string
  lateInterestMonthlyPercent: string
  lateMonths: string
}

interface FinancingForm {
  downPayment: string
  termMonths: string
  monthlyRatePercent: string
  amortizationSystem: AmortizationSystem
  iofPercent: string
  registrationFee: string
  monthlyInsurance: string
  mortgageInsurance: string
  appraisalCost: string
  contractRegistration: string
  notaryCost: string
  itbi: string
  dispatcherCost: string
  otherCosts: string
  annualIndexerPercent: string
  latePenaltyPercent: string
  lateInterestMonthlyPercent: string
  lateMonths: string
  earlyPaymentAmount: string
  earlyPaymentMonth: string
}

interface FormErrors {
  [key: string]: string | undefined
}

// ── validation ───────────────────────────────────────────────────────────────

function validate(
  g: GeneralForm,
  c: ConsortiumForm,
  f: FinancingForm
): FormErrors {
  const errors: FormErrors = {}

  if (!g.assetValue || parsePos(g.assetValue) === null || parse(g.assetValue) <= 0)
    errors["g.assetValue"] = "Informe o valor do bem"

  if (!c.creditValue || parsePos(c.creditValue) === null || parse(c.creditValue) <= 0)
    errors["c.creditValue"] = "Informe o valor da carta de crédito"

  const cTerm = parse(c.termMonths)
  if (!c.termMonths || cTerm <= 0 || cTerm > 600 || !Number.isInteger(cTerm))
    errors["c.termMonths"] = "Prazo entre 1 e 600 meses"

  if (parsePos(c.adminFeePercent) === null)
    errors["c.adminFeePercent"] = "Informe a taxa de administração"

  const cContempl = parse(c.contemplationMonth)
  if (cContempl < 1 || cContempl > cTerm || !Number.isInteger(cContempl))
    errors["c.contemplationMonth"] = `Entre 1 e ${cTerm} meses`

  const fDown = parse(f.downPayment)
  const assetV = parse(g.assetValue)
  if (parsePos(f.downPayment) === null || fDown > assetV)
    errors["f.downPayment"] = "Entrada não pode superar o valor do bem"

  const fTerm = parse(f.termMonths)
  if (!f.termMonths || fTerm <= 0 || fTerm > 600 || !Number.isInteger(fTerm))
    errors["f.termMonths"] = "Prazo entre 1 e 600 meses"

  const fRate = parse(f.monthlyRatePercent)
  if (parsePos(f.monthlyRatePercent) === null || fRate > 100)
    errors["f.monthlyRatePercent"] = "Taxa entre 0% e 100%"

  return errors
}

// ── main component ────────────────────────────────────────────────────────────

export function ComparacaoForm() {
  const [general, setGeneral] = useState<GeneralForm>({
    assetValue: "80000",
    monthlyIncome: "5000",
    availableCash: "10000",
    needsImmediately: false,
    maxIncomePercent: "30",
    annualAssetAppreciation: "0",
  })

  const [consortium, setConsortium] = useState<ConsortiumForm>({
    creditValue: "80000",
    termMonths: "60",
    adminFeePercent: "18",
    reserveFundPercent: "2",
    monthlyInsurance: "0",
    adhesionFee: "0",
    annualAdjustmentPercent: "0",
    ownBid: "0",
    embeddedBid: "0",
    contemplationMonth: "30",
    documentCosts: "0",
    appraisalCosts: "0",
    registryCosts: "0",
    otherCosts: "0",
    latePenaltyPercent: "2",
    lateInterestMonthlyPercent: "1",
    lateMonths: "0",
  })

  const [financing, setFinancing] = useState<FinancingForm>({
    downPayment: "16000",
    termMonths: "60",
    monthlyRatePercent: "1.5",
    amortizationSystem: "Price",
    iofPercent: "0.38",
    registrationFee: "0",
    monthlyInsurance: "0",
    mortgageInsurance: "0",
    appraisalCost: "0",
    contractRegistration: "0",
    notaryCost: "0",
    itbi: "0",
    dispatcherCost: "0",
    otherCosts: "0",
    annualIndexerPercent: "0",
    latePenaltyPercent: "2",
    lateInterestMonthlyPercent: "1",
    lateMonths: "0",
    earlyPaymentAmount: "0",
    earlyPaymentMonth: "0",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  function setG(field: keyof GeneralForm, value: string | boolean) {
    setGeneral((prev) => ({ ...prev, [field]: value }))
    if (submitted) setSubmitted(false)
  }

  function setC(field: keyof ConsortiumForm, value: string) {
    setConsortium((prev) => ({ ...prev, [field]: value }))
    if (submitted) setSubmitted(false)
    setErrors((prev) => ({ ...prev, [`c.${field}`]: undefined }))
  }

  function setF(field: keyof FinancingForm, value: string | AmortizationSystem) {
    setFinancing((prev) => ({ ...prev, [field]: value }))
    if (submitted) setSubmitted(false)
    setErrors((prev) => ({ ...prev, [`f.${field}`]: undefined }))
  }

  const result = useMemo(() => {
    if (!submitted) return null
    const errs = validate(general, consortium, financing)
    if (Object.keys(errs).length > 0) return null

    return calculateComparison(
      {
        assetValue: parse(general.assetValue),
        monthlyIncome: parse(general.monthlyIncome),
        availableCash: parse(general.availableCash),
        needsImmediately: general.needsImmediately,
        maxIncomePercent: parse(general.maxIncomePercent),
        annualAssetAppreciation: parse(general.annualAssetAppreciation),
      },
      {
        creditValue: parse(consortium.creditValue),
        termMonths: Math.round(parse(consortium.termMonths)),
        adminFeePercent: parse(consortium.adminFeePercent),
        reserveFundPercent: parse(consortium.reserveFundPercent),
        monthlyInsurance: parse(consortium.monthlyInsurance),
        adhesionFee: parse(consortium.adhesionFee),
        annualAdjustmentPercent: parse(consortium.annualAdjustmentPercent),
        ownBid: parse(consortium.ownBid),
        embeddedBid: parse(consortium.embeddedBid),
        contemplationMonth: Math.round(parse(consortium.contemplationMonth)),
        documentCosts: parse(consortium.documentCosts),
        appraisalCosts: parse(consortium.appraisalCosts),
        registryCosts: parse(consortium.registryCosts),
        otherCosts: parse(consortium.otherCosts),
        latePenaltyPercent: parse(consortium.latePenaltyPercent),
        lateInterestMonthlyPercent: parse(consortium.lateInterestMonthlyPercent),
        lateMonths: Math.round(parse(consortium.lateMonths)),
      },
      {
        assetValue: parse(general.assetValue),
        downPayment: parse(financing.downPayment),
        termMonths: Math.round(parse(financing.termMonths)),
        monthlyRatePercent: parse(financing.monthlyRatePercent),
        amortizationSystem: financing.amortizationSystem,
        iofPercent: parse(financing.iofPercent),
        registrationFee: parse(financing.registrationFee),
        monthlyInsurance: parse(financing.monthlyInsurance),
        mortgageInsurance: parse(financing.mortgageInsurance),
        appraisalCost: parse(financing.appraisalCost),
        contractRegistration: parse(financing.contractRegistration),
        notaryCost: parse(financing.notaryCost),
        itbi: parse(financing.itbi),
        dispatcherCost: parse(financing.dispatcherCost),
        otherCosts: parse(financing.otherCosts),
        annualIndexerPercent: parse(financing.annualIndexerPercent),
        latePenaltyPercent: parse(financing.latePenaltyPercent),
        lateInterestMonthlyPercent: parse(financing.lateInterestMonthlyPercent),
        lateMonths: Math.round(parse(financing.lateMonths)),
        earlyPaymentAmount: parse(financing.earlyPaymentAmount),
        earlyPaymentMonth: Math.round(parse(financing.earlyPaymentMonth)),
      }
    )
  }, [submitted, general, consortium, financing])

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [result])

  function handleCalculate() {
    const errs = validate(general, consortium, financing)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setSubmitted(true)
    }
  }

  const financedValue = Math.max(0, parse(general.assetValue) - parse(financing.downPayment))

  return (
    <div className="space-y-6">
      {/* ── Dados Gerais ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitCompare className="size-5" />
            Comparação: Consórcio vs Financiamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Preencha os dados do consórcio e do financiamento para comparar o custo real de cada opção, parcela por parcela.
          </p>

          <Separator />

          <h3 className="text-sm font-semibold">Dados Gerais</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="g-assetValue"
              label="Valor do bem (R$)"
              value={general.assetValue}
              onChange={(v) => setG("assetValue", v)}
              error={errors["g.assetValue"]}
              placeholder="80000"
            />
            <Field
              id="g-monthlyIncome"
              label="Renda mensal (R$)"
              hint="Usada para calcular o % comprometido da renda"
              value={general.monthlyIncome}
              onChange={(v) => setG("monthlyIncome", v)}
              placeholder="5000"
            />
            <Field
              id="g-availableCash"
              label="Valor disponível hoje (R$)"
              hint="Para verificar se cobre entrada, lance e custos iniciais"
              value={general.availableCash}
              onChange={(v) => setG("availableCash", v)}
              placeholder="10000"
            />
            <div className="space-y-1.5">
              <Label>Precisa do bem imediatamente?</Label>
              <ToggleGroup
                value={general.needsImmediately ? "sim" : "nao"}
                onChange={(v) => setG("needsImmediately", v === "sim")}
                options={[
                  { label: "Não", value: "nao" },
                  { label: "Sim", value: "sim" },
                ]}
              />
            </div>
            <Field
              id="g-maxIncomePercent"
              label="% máximo da renda a comprometer"
              hint="Gera alerta se a parcela ultrapassar esse limite"
              value={general.maxIncomePercent}
              onChange={(v) => setG("maxIncomePercent", v)}
              placeholder="30"
            />
            <Field
              id="g-annualAssetAppreciation"
              label="Reajuste anual estimado do bem (%)"
              hint="Apenas informativo para interpretação da comparação"
              value={general.annualAssetAppreciation}
              onChange={(v) => setG("annualAssetAppreciation", v)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Consórcio ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consórcio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="c-creditValue"
              label="Valor da carta de crédito (R$)"
              value={consortium.creditValue}
              onChange={(v) => setC("creditValue", v)}
              error={errors["c.creditValue"]}
              placeholder="80000"
            />
            <Field
              id="c-termMonths"
              label="Prazo (meses)"
              value={consortium.termMonths}
              onChange={(v) => setC("termMonths", v)}
              error={errors["c.termMonths"]}
              placeholder="60"
            />
            <Field
              id="c-adminFeePercent"
              label="Taxa de administração total (%)"
              hint="Percentual total cobrado sobre a carta ao longo do contrato"
              value={consortium.adminFeePercent}
              onChange={(v) => setC("adminFeePercent", v)}
              error={errors["c.adminFeePercent"]}
              placeholder="18"
            />
            <Field
              id="c-reserveFundPercent"
              label="Fundo de reserva (%)"
              hint="Percentual total sobre a carta"
              value={consortium.reserveFundPercent}
              onChange={(v) => setC("reserveFundPercent", v)}
              placeholder="2"
            />
            <Field
              id="c-monthlyInsurance"
              label="Seguro mensal (R$)"
              value={consortium.monthlyInsurance}
              onChange={(v) => setC("monthlyInsurance", v)}
              placeholder="0"
            />
            <Field
              id="c-adhesionFee"
              label="Taxa de adesão / antecipação (R$)"
              hint="Paga no início do contrato"
              value={consortium.adhesionFee}
              onChange={(v) => setC("adhesionFee", v)}
              placeholder="0"
            />
            <Field
              id="c-annualAdjustmentPercent"
              label="Reajuste anual da parcela (%)"
              hint="Aplica-se a partir do 13º mês e a cada 12 meses"
              value={consortium.annualAdjustmentPercent}
              onChange={(v) => setC("annualAdjustmentPercent", v)}
              placeholder="0"
            />
            <Field
              id="c-contemplationMonth"
              label="Mês estimado de contemplação"
              hint="Mês em que você prevê ser contemplado"
              value={consortium.contemplationMonth}
              onChange={(v) => setC("contemplationMonth", v)}
              error={errors["c.contemplationMonth"]}
              placeholder="30"
            />
            <Field
              id="c-ownBid"
              label="Lance próprio (R$)"
              hint="Valor do seu próprio dinheiro usado como lance"
              value={consortium.ownBid}
              onChange={(v) => setC("ownBid", v)}
              placeholder="0"
            />
            <Field
              id="c-embeddedBid"
              label="Lance embutido (R$)"
              hint="Reduz o crédito líquido recebido; não é dinheiro do seu bolso"
              value={consortium.embeddedBid}
              onChange={(v) => setC("embeddedBid", v)}
              placeholder="0"
            />
          </div>

          <Separator />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Custos na contemplação
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="c-documentCosts"
              label="Documentação (R$)"
              value={consortium.documentCosts}
              onChange={(v) => setC("documentCosts", v)}
              placeholder="0"
            />
            <Field
              id="c-appraisalCosts"
              label="Avaliação do bem (R$)"
              value={consortium.appraisalCosts}
              onChange={(v) => setC("appraisalCosts", v)}
              placeholder="0"
            />
            <Field
              id="c-registryCosts"
              label="Cartório / Registro / Garantia (R$)"
              value={consortium.registryCosts}
              onChange={(v) => setC("registryCosts", v)}
              placeholder="0"
            />
            <Field
              id="c-otherCosts"
              label="Outros custos extras (R$)"
              value={consortium.otherCosts}
              onChange={(v) => setC("otherCosts", v)}
              placeholder="0"
            />
          </div>

          <Separator />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Atraso (opcional)
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field
              id="c-latePenaltyPercent"
              label="Multa por atraso (%)"
              value={consortium.latePenaltyPercent}
              onChange={(v) => setC("latePenaltyPercent", v)}
              placeholder="2"
            />
            <Field
              id="c-lateInterestMonthlyPercent"
              label="Juros de mora a.m. (%)"
              value={consortium.lateInterestMonthlyPercent}
              onChange={(v) => setC("lateInterestMonthlyPercent", v)}
              placeholder="1"
            />
            <Field
              id="c-lateMonths"
              label="Meses em atraso"
              value={consortium.lateMonths}
              onChange={(v) => setC("lateMonths", v)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Financiamento ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financiamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="f-downPayment"
              label="Entrada (R$)"
              value={financing.downPayment}
              onChange={(v) => setF("downPayment", v)}
              error={errors["f.downPayment"]}
              placeholder="16000"
            />
            <div className="space-y-1.5">
              <Label>Valor financiado</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  financedValue
                )}
              </div>
              <p className="text-xs text-muted-foreground">Valor do bem − entrada</p>
            </div>
            <Field
              id="f-termMonths"
              label="Prazo (meses)"
              value={financing.termMonths}
              onChange={(v) => setF("termMonths", v)}
              error={errors["f.termMonths"]}
              placeholder="60"
            />
            <div className="space-y-1.5">
              <Label htmlFor="f-monthlyRatePercent">Taxa de juros mensal (%)</Label>
              <Input
                id="f-monthlyRatePercent"
                inputMode="decimal"
                placeholder="1.5"
                value={financing.monthlyRatePercent}
                onChange={(e) => setF("monthlyRatePercent", e.target.value)}
                aria-invalid={!!errors["f.monthlyRatePercent"]}
              />
              {errors["f.monthlyRatePercent"] && (
                <p className="text-xs text-destructive">{errors["f.monthlyRatePercent"]}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Sistema de amortização</Label>
              <ToggleGroup
                value={financing.amortizationSystem}
                onChange={(v) => setF("amortizationSystem", v as AmortizationSystem)}
                options={[
                  { label: "Price (parcela fixa)", value: "Price" },
                  { label: "SAC (parcela decrescente)", value: "SAC" },
                ]}
              />
            </div>
            <Field
              id="f-iofPercent"
              label="IOF (%)"
              value={financing.iofPercent}
              onChange={(v) => setF("iofPercent", v)}
              placeholder="0.38"
            />
            <Field
              id="f-registrationFee"
              label="Tarifa de cadastro (R$)"
              value={financing.registrationFee}
              onChange={(v) => setF("registrationFee", v)}
              placeholder="0"
            />
            <Field
              id="f-monthlyInsurance"
              label="Seguro mensal (R$)"
              value={financing.monthlyInsurance}
              onChange={(v) => setF("monthlyInsurance", v)}
              placeholder="0"
            />
            <Field
              id="f-mortgageInsurance"
              label="Seguro prestamista mensal (R$)"
              value={financing.mortgageInsurance}
              onChange={(v) => setF("mortgageInsurance", v)}
              placeholder="0"
            />
            <Field
              id="f-annualIndexerPercent"
              label="Indexador anual (%)"
              hint="Ex.: IPCA, TR. Reajusta o saldo devedor a cada 12 meses"
              value={financing.annualIndexerPercent}
              onChange={(v) => setF("annualIndexerPercent", v)}
              placeholder="0"
            />
          </div>

          <Separator />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Custos e tarifas
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="f-appraisalCost"
              label="Avaliação do bem (R$)"
              value={financing.appraisalCost}
              onChange={(v) => setF("appraisalCost", v)}
              placeholder="0"
            />
            <Field
              id="f-contractRegistration"
              label="Registro de contrato / Gravame (R$)"
              value={financing.contractRegistration}
              onChange={(v) => setF("contractRegistration", v)}
              placeholder="0"
            />
            <Field
              id="f-notaryCost"
              label="Cartório (R$)"
              value={financing.notaryCost}
              onChange={(v) => setF("notaryCost", v)}
              placeholder="0"
            />
            <Field
              id="f-itbi"
              label="ITBI (R$)"
              hint="Imposto de transmissão — apenas para imóveis"
              value={financing.itbi}
              onChange={(v) => setF("itbi", v)}
              placeholder="0"
            />
            <Field
              id="f-dispatcherCost"
              label="Despachante / Assessoria (R$)"
              value={financing.dispatcherCost}
              onChange={(v) => setF("dispatcherCost", v)}
              placeholder="0"
            />
            <Field
              id="f-otherCosts"
              label="Outros custos extras (R$)"
              value={financing.otherCosts}
              onChange={(v) => setF("otherCosts", v)}
              placeholder="0"
            />
          </div>

          <Separator />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Atraso e amortização antecipada (opcional)
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="f-latePenaltyPercent"
              label="Multa por atraso (%)"
              value={financing.latePenaltyPercent}
              onChange={(v) => setF("latePenaltyPercent", v)}
              placeholder="2"
            />
            <Field
              id="f-lateInterestMonthlyPercent"
              label="Juros de mora a.m. (%)"
              value={financing.lateInterestMonthlyPercent}
              onChange={(v) => setF("lateInterestMonthlyPercent", v)}
              placeholder="1"
            />
            <Field
              id="f-lateMonths"
              label="Meses em atraso"
              value={financing.lateMonths}
              onChange={(v) => setF("lateMonths", v)}
              placeholder="0"
            />
            <div />
            <Field
              id="f-earlyPaymentAmount"
              label="Amortização antecipada (R$)"
              hint="Valor extra pago para reduzir o saldo devedor"
              value={financing.earlyPaymentAmount}
              onChange={(v) => setF("earlyPaymentAmount", v)}
              placeholder="0"
            />
            <Field
              id="f-earlyPaymentMonth"
              label="Mês da amortização antecipada"
              value={financing.earlyPaymentMonth}
              onChange={(v) => setF("earlyPaymentMonth", v)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCalculate} className="w-full" size="lg">
        Comparar
      </Button>

      {result && (
        <>
          <AdBanner slot="mid" />

          <div ref={resultsRef} className="scroll-mt-4">
            <ComparisonResults result={result} />
          </div>

          <Separator />

          <ComparisonCharts result={result} />

          <ComparisonTable
            rows={result.rows}
            creditValue={parse(consortium.creditValue)}
            financedValue={result.financing.financedValue}
            breakEvenMonth={result.breakEvenMonth}
          />
        </>
      )}
    </div>
  )
}
