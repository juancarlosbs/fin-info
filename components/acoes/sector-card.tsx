import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getClassificacaoSetorialBrapi, BRAPI_SECTOR_TOTAL } from "@/lib/graham-bazin"

interface SectorCardProps {
  sector: string | null
}

export function SectorCard({ sector }: SectorCardProps) {
  const info = getClassificacaoSetorialBrapi(sector)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Classificação Setorial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground">Setor brapi</p>
            <p className="font-semibold">{info.sectorOriginal || "Não informado"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Posição setorial</p>
            <p className="font-semibold">
              {info.ordem !== null ? `${info.ordem} de ${BRAPI_SECTOR_TOTAL}` : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
          <div>
            <p className="text-muted-foreground text-xs">Setor</p>
            <p className="font-medium">{info.nomePt}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Categoria setorial</p>
            <p className="font-medium">{info.categoria}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Classificação</p>
            <p className="font-semibold" style={{ color: info.hex }}>
              {info.classificacao}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Nota setorial</p>
            <p className="font-semibold" style={{ color: info.hex }}>
              {info.nota !== null ? `${info.nota}/100` : "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Risco</p>
            <p className="font-medium">{info.risco}</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Comentário</p>
            <p className="text-sm leading-relaxed">{info.comentario}</p>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-3 leading-relaxed">
            Esta classificação avalia apenas a atratividade média do setor. Ela não substitui a análise
            dos fundamentos da empresa, como lucro, dívida, margens, ROE, geração de caixa, governança
            e valuation. Uma empresa de setor forte ainda pode ser ruim se estiver cara, endividada ou
            mal administrada. Uma empresa de setor mais arriscado ainda pode ser analisada, mas exige
            mais cautela.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
