import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type CalculationResult, formatBRL } from "@/lib/compound-interest"

interface BreakdownTableProps {
  result: CalculationResult
}

export function BreakdownTable({ result }: BreakdownTableProps) {
  const { breakdown } = result

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalhamento Mês a Mês</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-right">Mês</TableHead>
                <TableHead className="text-right">Aporte</TableHead>
                <TableHead className="text-right">Juros no Período</TableHead>
                <TableHead className="text-right">Total Investido</TableHead>
                <TableHead className="text-right">Total em Juros</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((row) => (
                <TableRow key={row.month} className="odd:bg-muted/30">
                  <TableCell className="text-right font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{formatBRL(row.contribution)}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    {formatBRL(row.periodInterest)}
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(row.totalInvested)}</TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400">
                    {formatBRL(row.totalInterest)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatBRL(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
