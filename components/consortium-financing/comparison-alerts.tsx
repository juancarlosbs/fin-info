import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ComparisonAlertsProps {
  alerts: string[]
}

export function ComparisonAlerts({ alerts }: ComparisonAlertsProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-amber-600" />
          Avisos da simulação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Esta simulação é estimativa e não substitui proposta oficial de banco, administradora, contrato, corretor, cartório ou análise profissional.</p>
        {alerts.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {alerts.map((alert) => <li key={alert}>{alert}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
