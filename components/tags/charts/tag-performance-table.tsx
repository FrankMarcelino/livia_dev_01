'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TagPerformanceData } from '@/types/dashboard';
import { formatDuration, formatPercentage } from '@/lib/utils/dashboard-helpers';

interface TagPerformanceTableProps {
  data: TagPerformanceData[];
}

export function TagPerformanceTable({ data }: TagPerformanceTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Tag</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">Msgs Média</TableHead>
                <TableHead className="text-right">Tempo Resp.</TableHead>
                <TableHead className="text-right">% IA</TableHead>
                <TableHead className="text-right">% Fechadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tag) => (
                <TableRow key={tag.tagId}>
                  <TableCell className="font-medium">{tag.tagName}</TableCell>
                  <TableCell className="text-right">{tag.totalConversations}</TableCell>
                  <TableCell className="text-right">{tag.avgMessages.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    {tag.avgResponseTime ? formatDuration(tag.avgResponseTime).display : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(tag.aiActivePercent)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(tag.closedPercent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
