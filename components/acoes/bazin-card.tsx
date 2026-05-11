import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type StockData, type BazinResult, formatBRL } from "@/lib/graham-bazin"

interface BazinCardProps {
  data: StockData
  result: BazinResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

export function BazinCard({ data, result }: BazinCardProps) {
  const isUndervalued = result.price !== null && data.price < result.price
  const effectiveDY = result.annualDividend > 0 && data.price > 0
    ? (result.annualDividend / data.price) * 100
    : (data.dividendYield !== null ? data.dividendYield * 100 : null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Fórmula de Bazin</CardTitle>
          {result.isValid && (
            <Badge variant={isUndervalued ? "default" : "secondary"}>
              {isUndervalued ? "Abaixo do valor justo" : "Acima do valor justo"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">DPA ÷ 6%</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.isValid && result.price !== null ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço Justo (Bazin)</p>
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
                <p className="text-muted-foreground text-xs">Dividend Yield atual</p>
                <p className={`font-medium ${effectiveDY !== null && effectiveDY >= 6 ? "text-green-600" : "text-red-500"}`}>
                  {effectiveDY !== null ? `${effectiveDY.toFixed(1)}%` : "—"}
                  <span className="text-muted-foreground font-normal"> (mín 6%)</span>
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
