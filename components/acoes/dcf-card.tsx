import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DCFCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DCF — Fluxo de Caixa Descontado</CardTitle>
        <p className="text-xs text-muted-foreground font-mono">
          Σ FCL/(1+WACC)ⁿ + Valor Terminal · 5 anos
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[130px]">
          <div className="select-none pointer-events-none blur-sm opacity-40 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preço Justo (DCF)</p>
                <p className="text-3xl font-bold">R$ 00,00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Potencial</p>
                <p className="text-lg font-semibold">+0,0%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
              <div><p className="text-muted-foreground text-xs">FCL/ação</p><p className="font-medium">R$ 0,00</p></div>
              <div><p className="text-muted-foreground text-xs">WACC</p><p className="font-medium">0,0% a.a.</p></div>
              <div><p className="text-muted-foreground text-xs">Crescimento FCL (g)</p><p className="font-medium">0,0% a.a.</p></div>
              <div><p className="text-muted-foreground text-xs">Crescimento terminal</p><p className="font-medium">0% a.a.</p></div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm font-semibold">Disponível em breve</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
