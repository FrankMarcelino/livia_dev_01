'use client';

import { useMemo } from 'react';
import {
  MessageSquare,
  PhoneForwarded,
  XCircle,
  Clock,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-base">Preview da Sequencia</CardTitle>
      </CardHeader>
      <CardContent>
        {stepsWithAccumulated.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Adicione etapas para visualizar a sequencia.
          </p>
        ) : (
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-0">
              {/* Inicio */}
              <div className="relative flex items-center gap-3 pb-4">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contato sem resposta</p>
                  <p className="text-xs text-muted-foreground">Inicio da reativacao</p>
                </div>
              </div>

              {/* Steps */}
              {stepsWithAccumulated.map((step, index) => {
                const Icon = actionIcons[step.action_type] || MessageSquare;
                const stepTags = (step.tag_ids || [])
                  .map((id) => tagsMap.get(id))
                  .filter(Boolean);

                return (
                  <div key={index} className="relative flex gap-3 pb-4">
                    {/* Dot */}
                    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* Tempo de espera */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          +{formatWait(step.wait_time_minutes || 0)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          (total: {formatWait(step.accumulatedMinutes)})
                        </span>
                      </div>

                      {/* Acao */}
                      <p className="text-sm font-medium">
                        {actionLabels[step.action_type] || step.action_type}
                      </p>

                      {/* Preview mensagem */}
                      {step.action_type === 'send_message' && step.action_parameter && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          &ldquo;{step.action_parameter}&rdquo;
                        </p>
                      )}

                      {/* Horario */}
                      {step.start_time && step.end_time && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {step.start_time} - {step.end_time}
                        </p>
                      )}

                      {/* Tags */}
                      {stepTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
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
              <div className="relative flex gap-3 pb-4">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      &ldquo;{settings.exhausted_message}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info box: Janela maxima */}
            {settings.max_reactivation_window_minutes && settings.max_reactivation_window_minutes > 0 && (
              <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400">
                      Janela Maxima: {formatWait(settings.max_reactivation_window_minutes)}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">
                      Se o tempo total exceder {formatWait(settings.max_reactivation_window_minutes)},{' '}
                      a acao sera: {fallbackLabels[settings.max_window_action] || settings.max_window_action}
                    </p>
                    {settings.max_window_message && settings.max_window_action !== 'do_nothing' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 line-clamp-2">
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
