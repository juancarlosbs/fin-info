import { TrendingUp, DollarSign, PiggyBank } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type CalculationResult, formatBRL, formatPct } from "@/lib/compound-interest"

interface ResultsSummaryProps {
  result: CalculationResult
}

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const { finalAmount, totalInvested, totalInterest, returnRate } = result

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border-primary/20 bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium opacity-80">
            <TrendingUp className="size-4" />
            Montante Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{formatBRL(finalAmount)}</p>
          <Badge className="mt-2 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-0">
            +{formatPct(returnRate)} de rendimento
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <PiggyBank className="size-4" />
            Total Investido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{formatBRL(totalInvested)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Aporte inicial + aportes mensais
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="size-4" />
            Total em Juros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            {formatBRL(totalInterest)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Rendimento dos juros compostos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
