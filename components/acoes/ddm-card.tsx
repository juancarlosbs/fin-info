import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type StockData, type DDMResult, formatBRL } from "@/lib/graham-bazin"

interface DDMCardProps {
  data: StockData
  result: DDMResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export function DDMCard({ data, result }: DDMCardProps) {
  const isUndervalued = result.price !== null && data.price < result.price

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">DDM — Gordon Growth</CardTitle>
          {result.isValid && (
            <Badge variant={isUndervalued ? "default" : "secondary"}>
              {isUndervalued ? "Abaixo do valor justo" : "Acima do valor justo"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">DPA × (1+g) / (r − g)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.isValid && result.price !== null ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço Justo (DDM)</p>
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
                <p className="text-muted-foreground text-xs">DPA (últ. 12 meses)</p>
                <p className="font-medium">{formatBRL(result.annualDividend)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Taxa de desconto (r)</p>
                <p className="font-medium">{(result.discountRate * 100).toFixed(0)}% a.a.</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Crescimento (g)</p>
                <p className="font-medium">{(result.growthRate * 100).toFixed(0)}% a.a.</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Spread (r − g)</p>
                <p className="font-medium">{((result.discountRate - result.growthRate) * 100).toFixed(0)}%</p>
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
