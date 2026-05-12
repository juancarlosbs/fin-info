import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type AveragePriceResult, formatBRL } from "@/lib/graham-bazin"

interface AveragePriceCardProps {
  currentPrice: number
  result: AveragePriceResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export function AveragePriceCard({ currentPrice, result }: AveragePriceCardProps) {
  if (result.price === null) return null

  const isUndervalued = currentPrice < result.price
  const validCount = result.methods.filter((m) => m.isValid).length

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Preço Médio Justo</CardTitle>
          <Badge variant={isUndervalued ? "default" : "secondary"} className="text-sm px-3 py-1">
            {isUndervalued ? "Abaixo da média" : "Acima da média"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Média aritmética dos {validCount} método{validCount !== 1 ? "s" : ""} válido{validCount !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Preço médio justo</p>
            <p className="text-4xl font-bold text-foreground">{formatBRL(result.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Potencial vs atual</p>
            <p className={`text-2xl font-bold ${isUndervalued ? "text-green-600" : "text-red-500"}`}>
              {upside(currentPrice, result.price)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
          {result.methods.map((method) => (
            <div key={method.label} className={`rounded-lg border p-3 text-center ${method.isValid ? "" : "opacity-40"}`}>
              <p className="text-xs text-muted-foreground mb-1">{method.label}</p>
              <p className="text-sm font-semibold">
                {method.price !== null ? formatBRL(method.price) : "N/D"}
              </p>
              {method.price !== null && (
                <p className={`text-xs mt-0.5 ${currentPrice < method.price ? "text-green-600" : "text-red-500"}`}>
                  {upside(currentPrice, method.price)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
