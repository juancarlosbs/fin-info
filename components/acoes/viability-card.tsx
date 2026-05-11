import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type ViabilityResult, type ViabilityClass } from "@/lib/graham-bazin"

interface ViabilityCardProps {
  result: ViabilityResult
}

const CLASS_CONFIG: Record<
  ViabilityClass,
  { label: string; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline"; description: string }
> = {
  COMPRA_FORTE: {
    label: "Compra Forte",
    color: "text-green-700",
    badgeVariant: "default",
    description: "Abaixo de Graham e Bazin com forte fundamento",
  },
  COMPRA: {
    label: "Compra",
    color: "text-green-600",
    badgeVariant: "default",
    description: "Abaixo de ao menos uma métrica de valor com bom fundamento",
  },
  NEUTRO: {
    label: "Neutro",
    color: "text-yellow-600",
    badgeVariant: "outline",
    description: "Preço próximo ao valor justo — aguardar melhor ponto",
  },
  CARO: {
    label: "Caro",
    color: "text-red-600",
    badgeVariant: "secondary",
    description: "Acima dos valores justos de Graham e Bazin",
  },
  EVITAR: {
    label: "Evitar",
    color: "text-red-700",
    badgeVariant: "destructive",
    description: "Lucro negativo, sem dividendos ou fundamentos críticos",
  },
}

export function ViabilityCard({ result }: ViabilityCardProps) {
  const config = CLASS_CONFIG[result.classification]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Classificação de Viabilidade</CardTitle>
          <Badge variant={config.badgeVariant} className="text-sm px-3 py-1">
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <span>Pontuação de fundamentos</span>
          <span className={`font-semibold text-base ${config.color}`}>
            {result.score}/{result.maxScore}
          </span>
        </div>
        <div className="space-y-2">
          {result.criteria.map((criterion) => (
            <div key={criterion.label} className="flex items-start justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 text-base leading-none ${criterion.passed ? "text-green-600" : "text-muted-foreground"}`}>
                  {criterion.passed ? "✓" : "✗"}
                </span>
                <span className={criterion.passed ? "text-foreground" : "text-muted-foreground"}>
                  {criterion.label}
                </span>
              </div>
              <span className={`shrink-0 text-xs font-mono ${criterion.passed ? "text-green-700" : "text-muted-foreground"}`}>
                {criterion.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
