'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Loader2, FileText } from 'lucide-react';


interface ConversationSummaryModalProps {
  contactId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  metadados?: {
    ultima_atualizacao?: string;
    ultimo_agente_ativo?: string;
  };
  memoria_conversacional?: {
    resumo_acumulado?: string;
    pendencias_abertas?: string[];
  };
  [key: string]: any;
}

export function ConversationSummaryModal({
  contactId,
  isOpen,
  onClose,
}: ConversationSummaryModalProps) {
  const [data, setData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && contactId) {
      fetchData();
    }
  }, [isOpen, contactId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('customer_data_extracted')
        .eq('id', contactId)
        .single();

      if (error) throw error;

      if (contact?.customer_data_extracted) {
        setData(contact.customer_data_extracted as ExtractedData);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching conversation summary:', err);
      setError('Erro ao carregar o resumo da conversa.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderSection = (title: string, content: any) => {
    if (!content || typeof content !== 'object') return null;

    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          {formatKey(title)}
        </h3>
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 border">
          {Object.entries(content).map(([key, value]) => {
            if (key === 'fase_concluida') return null; // Skip this internal flag if desired, or show it
            
            let displayValue = value;
            if (value === null || value === undefined) displayValue = '-';
            if (typeof value === 'boolean') displayValue = value ? 'Sim' : 'Não';
            if (Array.isArray(value)) displayValue = value.join(', ') || '-';

            return (
              <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-sm">
                <span className="font-medium text-foreground/80">{formatKey(key)}:</span>
                <span className="text-muted-foreground sm:text-right">{String(displayValue)}</span>
              </div>
            );
          })}
          
          {/* Special handling for 'fase_concluida' to show it prominently if needed, 
              or just let it be rendered in the loop above. 
              Let's add a visual indicator for completion if present. */}
          {content.fase_concluida !== undefined && (
            <div className="mt-2 pt-2 border-t flex justify-between items-center">
              <span className="text-xs font-medium uppercase">Status da Fase</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${content.fase_concluida ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {content.fase_concluida ? 'Concluída' : 'Em Andamento'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sort keys to ensure specific order if needed, otherwise alphabetical or specific priority
  const getSortedKeys = (obj: ExtractedData) => {
    const priority = ['metadados', 'fase_1', 'fase_2', 'fase_3', 'fase_4', 'memoria_conversacional'];
    return Object.keys(obj).sort((a, b) => {
      const indexA = priority.findIndex(p => a.startsWith(p));
      const indexB = priority.findIndex(p => b.startsWith(p));
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Resumo da Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : !data ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resumo disponível para esta conversa.
            </div>
          ) : (
            <div className="py-2 space-y-6">
              {/* Metadados */}
              {data.metadados && renderSection('metadados', data.metadados)}

              {/* Fases e Outros */}
              {getSortedKeys(data)
                .filter(key => key !== 'metadados' && key !== 'memoria_conversacional')
                .map(key => renderSection(key, data[key]))}

              {/* Memória Conversacional */}
              {data.memoria_conversacional && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Memória Conversacional
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/50">
                    {data.memoria_conversacional.resumo_acumulado && (
                      <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                        {data.memoria_conversacional.resumo_acumulado}
                      </p>
                    )}
                    {data.memoria_conversacional.pendencias_abertas && 
                     data.memoria_conversacional.pendencias_abertas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/50">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                          Pendências:
                        </span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {data.memoria_conversacional.pendencias_abertas.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
