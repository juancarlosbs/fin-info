import { TrendingUp, Home, PiggyBank, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type PropertyResult, type ScenarioSummary } from "@/lib/property-calculator"
import { formatBRL } from "@/lib/compound-interest"

interface ScenarioCardsProps {
  scenarios: PropertyResult["scenarios"]
}

interface ScenarioConfig {
  key: keyof PropertyResult["scenarios"]
  label: string
  icon: React.ReactNode
  description: string
}

const SCENARIOS: ScenarioConfig[] = [
  {
    key: "rentInvest",
    label: "Alugar + Investir",
    icon: <PiggyBank className="size-4" />,
    description: "Investe a entrada e a diferença orçamento−aluguel",
  },
  {
    key: "financeInvest",
    label: "Financiar + Investir",
    icon: <TrendingUp className="size-4" />,
    description: "Financia o imóvel e investe o excedente do orçamento",
  },
  {
    key: "financeOnly",
    label: "Apenas Financiar",
    icon: <Home className="size-4" />,
    description: "Paga somente o financiamento SAC, sem investimento extra",
  },
  {
    key: "financeAmortize",
    label: "Financiar + Amortizar",
    icon: <Zap className="size-4" />,
    description: "Amortiza o saldo devedor com o excedente, quitando mais rápido",
  },
]

export function ScenarioCards({ scenarios }: ScenarioCardsProps) {
  const values = SCENARIOS.map((s) => scenarios[s.key].finalWealth)
  const maxWealth = Math.max(...values)

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Comparação de Cenários</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SCENARIOS.map((scenario) => {
          const data: ScenarioSummary = scenarios[scenario.key]
          const isWinner = data.finalWealth === maxWealth
          return (
            <ScenarioCard
              key={scenario.key}
              label={scenario.label}
              icon={scenario.icon}
              description={scenario.description}
              data={data}
              isWinner={isWinner}
            />
          )
        })}
      </div>
    </div>
  )
}

interface ScenarioCardProps {
  label: string
  icon: React.ReactNode
  description: string
  data: ScenarioSummary
  isWinner: boolean
}

function ScenarioCard({ label, icon, description, data, isWinner }: ScenarioCardProps) {
  return (
    <Card
      className={
        isWinner
          ? "border-primary/30 bg-primary text-primary-foreground"
          : ""
      }
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={
            "flex items-center justify-between text-sm font-medium " +
            (isWinner ? "opacity-90" : "text-muted-foreground")
          }
        >
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          {isWinner && (
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 hover:bg-primary-foreground/30 text-xs">
              Melhor
            </Badge>
          )}
        </CardTitle>
        <p
          className={
            "text-xs " +
            (isWinner ? "opacity-70" : "text-muted-foreground")
          }
        >
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p
            className={
              "text-2xl font-bold tracking-tight " +
              (!isWinner ? "text-foreground" : "")
            }
          >
            {formatBRL(data.finalWealth)}
          </p>
          <p
            className={
              "text-xs mt-0.5 " +
              (isWinner ? "opacity-70" : "text-muted-foreground")
            }
          >
            Patrimônio líquido final
          </p>
        </div>

        <div
          className={
            "space-y-1 border-t pt-3 " +
            (isWinner ? "border-primary-foreground/20" : "border-border")
          }
        >
          {data.propertyValue > 0 && (
            <Row
              label="Imóvel valorizado"
              value={formatBRL(data.propertyValue)}
              isWinner={isWinner}
            />
          )}
          {data.remainingDebt > 0 && (
            <Row
              label="Saldo devedor"
              value={`− ${formatBRL(data.remainingDebt)}`}
              isWinner={isWinner}
              negative
            />
          )}
          {data.portfolio > 0 && (
            <Row
              label="Portfólio financeiro"
              value={formatBRL(data.portfolio)}
              isWinner={isWinner}
            />
          )}
          {data.paidOffMonth !== null && (
            <Row
              label="Quitação antecipada"
              value={`Mês ${data.paidOffMonth}`}
              isWinner={isWinner}
            />
          )}
          <Row
            label="Total desembolsado"
            value={formatBRL(data.totalPaid)}
            isWinner={isWinner}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface RowProps {
  label: string
  value: string
  isWinner: boolean
  negative?: boolean
}

function Row({ label, value, isWinner, negative = false }: RowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={isWinner ? "opacity-70" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          negative
            ? isWinner
              ? "opacity-80 font-medium"
              : "text-destructive font-medium"
            : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  )
}
