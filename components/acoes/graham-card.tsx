import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type StockData, type GrahamResult, formatBRL } from "@/lib/graham-bazin"

interface GrahamCardProps {
  data: StockData
  result: GrahamResult
}

function upside(current: number, target: number): string {
  const pct = ((target - current) / current) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

export function GrahamCard({ data, result }: GrahamCardProps) {
  const isUndervalued = result.price !== null && data.price < result.price

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Fórmula de Graham</CardTitle>
          {result.isValid && (
            <Badge variant={isUndervalued ? "default" : "secondary"}>
              {isUndervalued ? "Abaixo do valor justo" : "Acima do valor justo"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">√(22,5 × LPA × VPA)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.isValid && result.price !== null ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço Justo (Graham)</p>
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
                <p className="text-muted-foreground text-xs">LPA (EPS)</p>
                <p className="font-medium">{data.eps !== null ? formatBRL(data.eps) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">VPA (Book Value)</p>
                <p className="font-medium">{data.bookValue !== null ? formatBRL(data.bookValue) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">P/L atual</p>
                <p className={`font-medium ${data.priceEarnings !== null && data.priceEarnings <= 15 ? "text-green-600" : "text-red-500"}`}>
                  {data.priceEarnings !== null && data.priceEarnings > 0 ? data.priceEarnings.toFixed(1) : "—"}
                  <span className="text-muted-foreground font-normal"> (máx 15)</span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">P/VP atual</p>
                <p className={`font-medium ${data.priceToBook !== null && data.priceToBook <= 1.5 ? "text-green-600" : "text-red-500"}`}>
                  {data.priceToBook !== null ? data.priceToBook.toFixed(2) : "—"}
                  <span className="text-muted-foreground font-normal"> (máx 1,5)</span>
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
