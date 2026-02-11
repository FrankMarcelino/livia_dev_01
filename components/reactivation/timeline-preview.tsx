'use client';

import { useMemo } from 'react';
import {
  MessageSquare,
  PhoneForwarded,
  XCircle,
  Clock,
  AlertTriangle,
  Tag,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  ReactivationSettingsFormData,
  ReactivationStepFormData,
} from '@/lib/validations/reactivationValidation';

interface TimelinePreviewProps {
  steps: ReactivationStepFormData[];
  settings: ReactivationSettingsFormData;
  availableTags: { id: string; tag_name: string; tag_type: string; color: string | null }[];
}

const actionIcons: Record<string, typeof MessageSquare> = {
  send_message: MessageSquare,
  close_conversation: XCircle,
  transfer_to_human: PhoneForwarded,
};

const actionLabels: Record<string, string> = {
  send_message: 'Enviar Mensagem',
  close_conversation: 'Encerrar Conversa',
  transfer_to_human: 'Transferir para Humano',
};

const actionColors: Record<string, string> = {
  send_message: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  close_conversation: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400',
  transfer_to_human: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const fallbackLabels: Record<string, string> = {
  end_conversation: 'Encerrar Conversa',
  transfer_to_human: 'Transferir para Humano',
  do_nothing: 'Nao fazer nada',
};

function formatWait(minutes: number): string {
  if (!minutes || minutes <= 0) return '0min';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function TimelinePreview({ steps, settings, availableTags }: TimelinePreviewProps) {
  const tagsMap = useMemo(() => {
    const map = new Map<string, { tag_name: string; color: string | null }>();
    for (const tag of availableTags) {
      map.set(tag.id, { tag_name: tag.tag_name, color: tag.color });
    }
    return map;
  }, [availableTags]);

  // Calcular tempo acumulado
  const stepsWithAccumulated = useMemo(() => {
    let accumulated = 0;
    return (steps || []).map((step) => {
      accumulated += step.wait_time_minutes || 0;
      return { ...step, accumulatedMinutes: accumulated };
    });
  }, [steps]);

  return (
    <Card className="sticky top-6 overflow-hidden">
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Preview da Sequencia</h3>
            <p className="text-xs text-muted-foreground">Visualizacao em tempo real</p>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        {stepsWithAccumulated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">Adicione etapas para visualizar a sequencia.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical com gradiente */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-primary via-border to-destructive" />

            <div className="space-y-0">
              {/* Inicio */}
              <div className="relative flex items-center gap-3 pb-6">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contato sem resposta</p>
                  <p className="text-xs text-muted-foreground">Inicio da reativacao</p>
                </div>
              </div>

              {/* Steps */}
              {stepsWithAccumulated.map((step, index) => {
                const Icon = actionIcons[step.action_type] || MessageSquare;
                const color = actionColors[step.action_type] || 'border-border bg-muted text-muted-foreground';
                const stepTags = (step.tag_ids || [])
                  .map((id) => tagsMap.get(id))
                  .filter(Boolean);

                return (
                  <div key={index} className="relative flex gap-3 pb-6">
                    {/* Dot */}
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${color} shadow-sm`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* Tempo de espera */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs font-normal gap-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          +{formatWait(step.wait_time_minutes || 0)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          total: {formatWait(step.accumulatedMinutes)}
                        </span>
                      </div>

                      {/* Acao */}
                      <p className="text-sm font-medium">
                        {actionLabels[step.action_type] || step.action_type}
                      </p>

                      {/* Preview mensagem */}
                      {step.action_type === 'send_message' && step.action_parameter && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                          &ldquo;{step.action_parameter}&rdquo;
                        </p>
                      )}

                      {/* Horario */}
                      {step.start_time && step.end_time && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {step.start_time} - {step.end_time}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {stepTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {stepTags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px]"
                              style={tag!.color ? { borderColor: tag!.color } : undefined}
                            >
                              {tag!.color && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full mr-1"
                                  style={{ backgroundColor: tag!.color }}
                                />
                              )}
                              {tag!.tag_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Fallback: Etapas esgotadas */}
              <div className="relative flex gap-3">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-destructive">
                    Etapas esgotadas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fallbackLabels[settings.exhausted_action] || settings.exhausted_action}
                  </p>
                  {settings.exhausted_message && settings.exhausted_action !== 'do_nothing' && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                      &ldquo;{settings.exhausted_message}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info box: Janela maxima */}
            {settings.max_reactivation_window_minutes && settings.max_reactivation_window_minutes > 0 && (
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                      Janela Maxima: {formatWait(settings.max_reactivation_window_minutes)}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                      Se o tempo total exceder {formatWait(settings.max_reactivation_window_minutes)},{' '}
                      a acao sera: {fallbackLabels[settings.max_window_action] || settings.max_window_action}
                    </p>
                    {settings.max_window_message && settings.max_window_action !== 'do_nothing' && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 line-clamp-2 italic">
                        &ldquo;{settings.max_window_message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
