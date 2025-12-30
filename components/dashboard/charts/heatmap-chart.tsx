'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeatmapData } from '@/types/dashboard';
import {
  getDayName,
  calculateHeatmapIntensity,
} from '@/lib/utils/dashboard-helpers';

interface HeatmapChartProps {
  data: HeatmapData[];
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  // Agrupar dados por dia da semana e hora
  const heatmapMatrix: Record<number, Record<number, number>> = {};

  // Encontrar valor máximo para normalização
  let maxValue = 0;
  data.forEach((item) => {
    if (!heatmapMatrix[item.dayOfWeek]) {
      heatmapMatrix[item.dayOfWeek] = {};
    }
    heatmapMatrix[item.dayOfWeek]![item.hour] = item.count;
    maxValue = Math.max(maxValue, item.count);
  });

  // Encontrar os 10 maiores valores para mostrar números
  const top10Values = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({ day: item.dayOfWeek, hour: item.hour, count: item.count }));

  const shouldShowNumber = (day: number, hour: number) => {
    return top10Values.some(item => item.day === day && item.hour === hour);
  };

  // Dias da semana (0 = Domingo, 6 = Sábado)
  const days = [0, 1, 2, 3, 4, 5, 6];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap de Volume (Dia × Hora)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header com horas */}
            <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground" />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="text-xs text-center text-muted-foreground"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Grid de dias × horas */}
            {days.map((day) => (
              <div
                key={day}
                className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-1"
              >
                {/* Label do dia */}
                <div className="text-xs font-medium text-muted-foreground flex items-center">
                  {getDayName(day)}
                </div>

                {/* Células por hora */}
                {hours.map((hour) => {
                  const count = heatmapMatrix[day]?.[hour] || 0;
                  const intensity = calculateHeatmapIntensity(count, maxValue);
                  const showNum = shouldShowNumber(day, hour);

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="aspect-square rounded transition-colors group relative"
                      style={{
                        backgroundColor: getHeatmapColor(intensity),
                      }}
                      title={`${getDayName(day) || 'Dia'}, ${hour}:00 - ${count} conversas`}
                    >
                      {/* Número permanente para os 10 maiores */}
                      {showNum && count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {count}
                          </span>
                        </div>
                      )}

                      {/* Tooltip on hover para todos */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legenda */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">Menos</span>
              <div className="flex gap-1">
                {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getHeatmapColor(intensity) }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Mais</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getHeatmapColor(intensity: number): string {
  // Gradiente de cinza claro a azul escuro
  const colors = [
    'hsl(var(--muted))', // 0% - muito claro
    'hsl(220, 60%, 85%)', // 25%
    'hsl(220, 70%, 65%)', // 50%
    'hsl(220, 80%, 50%)', // 75%
    'hsl(220, 90%, 35%)', // 100% - muito escuro
  ];

  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  const color = colors[index];
  return color ?? 'hsl(var(--muted))';
}
