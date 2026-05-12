import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type StockData, type LynchResult, formatBRL } from "@/lib/graham-bazin"

interface LynchCardProps {
  data: StockData
  result: LynchResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export function LynchCard({ data, result }: LynchCardProps) {
  const isUndervalued = result.price !== null && data.price < result.price

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Peter Lynch — PEG</CardTitle>
          {result.isValid && (
            <Badge variant={isUndervalued ? "default" : "secondary"}>
              {isUndervalued ? "Abaixo do valor justo" : "Acima do valor justo"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">LPA × crescimento (%)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.isValid && result.price !== null ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço Justo (Lynch)</p>
                <p className="text-3xl font-bold text-foreground">{formatBRL(result.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Potencial</p>
                <p className={`text-lg font-semibold ${isUndervalued ? "text-green-600" : "text-red-500"}`}>
                  {upside(data.price, result.price)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground text-xs">LPA</p>
                <p className="font-medium">{data.eps !== null ? formatBRL(data.eps) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Crescimento dos lucros</p>
                <p className="font-medium">
                  {result.growthRate !== null ? `${(result.growthRate * 100).toFixed(1)}%` : "—"}
                  {result.rawGrowthRate !== null && result.rawGrowthRate > 0.5 && (
                    <span className="block text-xs text-muted-foreground">
                      API: {(result.rawGrowthRate * 100).toFixed(0)}% → limitado a 50%
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">PEG atual</p>
                <p className="font-medium">
                  {data.priceEarnings !== null && result.growthRate !== null && result.growthRate > 0
                    ? (data.priceEarnings / (result.growthRate * 100)).toFixed(2)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">P/L atual</p>
                <p className="font-medium">
                  {data.priceEarnings !== null ? data.priceEarnings.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{result.reason ?? "Dados insuficientes"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
