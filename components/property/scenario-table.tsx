import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatBRL } from "@/lib/compound-interest"
import { type MonthlySnap } from "@/lib/property-calculator"

interface ScenarioTableProps {
  breakdown: MonthlySnap[]
}

export function ScenarioTable({ breakdown }: ScenarioTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalhamento dos Cenários Mês a Mês</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="max-h-96 overflow-y-auto">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="text-right">Mês</TableHead>
                  <TableHead className="text-right">Alugar + Investir</TableHead>
                  <TableHead className="text-right">Financiar + Investir</TableHead>
                  <TableHead className="text-right">Apenas Financiar</TableHead>
                  <TableHead className="text-right">Financiar + Amortizar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((row) => (
                  <TableRow key={row.month} className="odd:bg-muted/30">
                    <TableCell className="text-right font-medium">{row.month}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatBRL(row.rentInvest)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                      {formatBRL(row.financeInvest)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600 dark:text-amber-400">
                      {formatBRL(row.financeOnly)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-600 dark:text-purple-400">
                      {formatBRL(row.financeAmortize)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
