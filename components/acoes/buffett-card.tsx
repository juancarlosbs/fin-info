import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type StockData, type BuffettResult, formatBRL } from "@/lib/graham-bazin"

interface BuffettCardProps {
  data: StockData
  result: BuffettResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export function BuffettCard({ data, result }: BuffettCardProps) {
  const isUndervalued = result.safetyPrice !== null && data.price < result.safetyPrice

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Warren Buffett — Owner Earnings</CardTitle>
          {result.isValid && (
            <Badge variant={isUndervalued ? "default" : "secondary"}>
              {isUndervalued ? "Abaixo do valor justo" : "Acima do valor justo"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          Σ OE/ação/(1+r)ⁿ + Valor Terminal · {result.years} anos · MOS 30%
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.isValid && result.price !== null && result.safetyPrice !== null ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço com Margem de Segurança (30%)</p>
                <p className="text-3xl font-bold text-foreground">{formatBRL(result.safetyPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Potencial</p>
                <p className={`text-lg font-semibold ${isUndervalued ? "text-green-600" : "text-red-500"}`}>
                  {upside(data.price, result.safetyPrice)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground text-xs">Valor Intrínseco</p>
                <p className="font-medium">{formatBRL(result.price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">OE/ação</p>
                <p className="font-medium">
                  {result.oePerShare !== null ? formatBRL(result.oePerShare) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Taxa de desconto (r)</p>
                <p className="font-medium">{(result.discountRate * 100).toFixed(0)}% a.a.</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Crescimento (g)</p>
                <p className="font-medium">{(result.growthRate * 100).toFixed(1)}% a.a.</p>
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
