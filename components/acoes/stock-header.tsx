import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type StockData, formatBRL, getSectorLabel } from "@/lib/graham-bazin"

interface StockHeaderProps {
  data: StockData
}

export function StockHeader({ data }: StockHeaderProps) {
  const changeClass = (data.price ?? 0) >= 0 ? "text-green-600" : "text-red-600"

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-foreground">{data.symbol}</span>
              <Badge variant="outline">{getSectorLabel(data.sectorKey)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">{data.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{formatBRL(data.price)}</p>
            <p className={`text-xs ${changeClass}`}>preço atual</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
