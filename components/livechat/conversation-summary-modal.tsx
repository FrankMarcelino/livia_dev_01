'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Loader2, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Safe wrapper to ensure we never render objects directly
const SafeValue = ({ value }: { value: any }) => {
  if (value === null || value === undefined) {
    return <>-</>;
  }

  if (typeof value === 'object') {
    try {
      return <>{JSON.stringify(value)}</>;
    } catch {
      return <>[Object]</>;
    }
  }

  return <>{String(value)}</>;
};

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
  const [isMounted, setIsMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const supabase = createClient();

  // Ensure client-side only rendering to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && contactId && isMounted) {
      fetchData();
    }
  }, [isOpen, contactId, isMounted]);

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
        // Validate that the data is an object
        if (typeof contact.customer_data_extracted !== 'object') {
          console.warn('customer_data_extracted is not an object:', contact.customer_data_extracted);
          setError('Dados em formato inválido.');
          return;
        }

        // Se os dados estão dentro de uma chave 'json', extrair
        let extractedData: any = contact.customer_data_extracted;
        
        if (extractedData && typeof extractedData === 'object' && !Array.isArray(extractedData)) {
          if ('json' in extractedData && typeof extractedData.json === 'object' && extractedData.json !== null) {
            extractedData = extractedData.json;
          }
        }

        setData(extractedData as ExtractedData);
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

  const formatValueForCopy = (value: any, indent = 0): string => {
    const indentation = '  '.repeat(indent);

    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      const items = value.map(item => `${indentation}  - ${formatValueForCopy(item, 0)}`).join('\n');
      return `\n${items}`;
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Objeto não serializável]';
      }
    }

    return String(value);
  };

  const handleCopyToClipboard = async () => {
    if (!data) return;

    try {
      let textContent = '═══════════════════════════════════\n';
      textContent += '     RESUMO DA CONVERSA\n';
      textContent += '═══════════════════════════════════\n\n';

      // Metadados
      if (data.metadados) {
        textContent += '📋 METADADOS\n';
        textContent += '───────────────────────────────────\n';
        Object.entries(data.metadados).forEach(([key, value]) => {
          textContent += `${formatKey(key)}: ${formatValueForCopy(value)}\n`;
        });
        textContent += '\n';
      }

      // Seções dinâmicas (excluindo metadados e memoria_conversacional que já foram processados)
      const sortedKeys = getSortedKeys(data)
        .filter(key => 
          key.toLowerCase() !== 'metadados' && 
          key.toLowerCase() !== 'memoria_conversacional'
        );

      sortedKeys.forEach(key => {
        const content = data[key];
        if (content && typeof content === 'object') {
          textContent += `📌 ${formatKey(key).toUpperCase()}\n`;
          textContent += '───────────────────────────────────\n';
          Object.entries(content).forEach(([fieldKey, fieldValue]) => {
            if (fieldKey === 'fase_concluida') {
              textContent += `Status: ${fieldValue ? '✓ Concluída' : '⏳ Em Andamento'}\n`;
            } else {
              textContent += `${formatKey(fieldKey)}: ${formatValueForCopy(fieldValue)}\n`;
            }
          });
          textContent += '\n';
        }
      });

      // Memória Conversacional
      if (data.memoria_conversacional) {
        textContent += '🧠 MEMÓRIA CONVERSACIONAL\n';
        textContent += '───────────────────────────────────\n';

        if (data.memoria_conversacional.resumo_acumulado) {
          textContent += `Resumo:\n${formatValueForCopy(data.memoria_conversacional.resumo_acumulado)}\n\n`;
        }

        if (data.memoria_conversacional.pendencias_abertas &&
            Array.isArray(data.memoria_conversacional.pendencias_abertas) &&
            data.memoria_conversacional.pendencias_abertas.length > 0) {
          textContent += 'Pendências:\n';
          data.memoria_conversacional.pendencias_abertas.forEach((item, idx) => {
            textContent += `  ${idx + 1}. ${formatValueForCopy(item)}\n`;
          });
        }
      }

      textContent += '\n═══════════════════════════════════\n';
      textContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;

      await navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      toast.success('Dados copiados para área de transferência!');

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Erro ao copiar dados.');
    }
  };

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderValue = (value: any): React.ReactNode => {
    try {
      // Handle null/undefined
      if (value === null || value === undefined) return '-';

      // Handle booleans
      if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return '-';
        // Check if all items are primitives
        const allPrimitives = value.every(item =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean' ||
          item === null ||
          item === undefined
        );
        if (allPrimitives) {
          return value.filter(item => item !== null && item !== undefined).join(', ') || '-';
        }
        // If complex array, render as JSON
        try {
          const jsonString = JSON.stringify(value, null, 2);
          return (
            <pre className="text-xs bg-muted/50 p-2 rounded max-w-full overflow-x-auto whitespace-pre-wrap">
              {jsonString}
            </pre>
          );
        } catch {
          return <span className="text-xs text-red-500">[Array não serializável]</span>;
        }
      }

      // Handle objects (nested)
      if (typeof value === 'object') {
        try {
          const jsonString = JSON.stringify(value, null, 2);
          return (
            <pre className="text-xs bg-muted/50 p-2 rounded max-w-full overflow-x-auto whitespace-pre-wrap">
              {jsonString}
            </pre>
          );
        } catch {
          return <span className="text-xs text-red-500">[Objeto não serializável]</span>;
        }
      }

      // Handle primitives (string, number)
      return String(value);
    } catch (err) {
      console.error('Error in renderValue:', err, 'value:', value);
      return <span className="text-xs text-red-500">[Erro ao renderizar valor]</span>;
    }
  };

  const renderSection = (title: string, content: any) => {
    try {
      if (!content || typeof content !== 'object') return null;

      return (
        <div className="mb-6 last:mb-0">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {formatKey(title)}
          </h3>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 border">
            {Object.entries(content).map(([key, value]) => {
              if (key === 'fase_concluida') return null; // Skip this internal flag if desired, or show it

              try {
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
                    <span className="font-medium text-foreground/80">{formatKey(key)}:</span>
                    <span className="text-muted-foreground sm:text-right break-words">
                      {renderValue(value)}
                    </span>
                  </div>
                );
              } catch (err) {
                console.error(`Error rendering field ${key}:`, err);
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
                    <span className="font-medium text-foreground/80">{formatKey(key)}:</span>
                    <span className="text-red-500 text-xs">Erro ao renderizar campo</span>
                  </div>
                );
              }
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
    } catch (err) {
      console.error(`Error rendering section ${title}:`, err);
      return (
        <div className="mb-6 last:mb-0">
          <h3 className="text-sm font-semibold text-red-500 mb-2 uppercase tracking-wider">
            {formatKey(title)} - Erro ao renderizar
          </h3>
        </div>
      );
    }
  };

  /**
   * Detecta se uma chave é uma fase (dinamicamente)
   * Aceita padrões como: fase_1, fase_2, fase_abc, "Fase 1 Recepcao", "Fase 2 Vendas", etc.
   */
  const isPhaseKey = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    // Aceita qualquer chave que comece com "fase" seguido de espaço, underscore, hífen ou número
    return /^fase[\s_\-]/.test(lowerKey) || /^fase\d/.test(lowerKey);
  };

  /**
   * Extrai número da fase para ordenação (se existir)
   * Ex: "fase_1" -> 1, "fase_2" -> 2, "Fase 1 Recepcao" -> 1, "Fase 2 Vendas" -> 2
   */
  const extractPhaseNumber = (key: string): number | null => {
    // Procura por padrões: "fase 1", "fase_1", "fase-1", "Fase 1 Recepcao", "Fase 2 Vendas", etc.
    // Aceita espaço, underscore ou hífen após "fase", seguido de um ou mais dígitos
    const match = key.match(/fase[\s_\-]+(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    }
    // Também tenta padrão sem separador: "fase1", "Fase1", etc.
    const matchNoSeparator = key.match(/fase(\d+)/i);
    if (matchNoSeparator && matchNoSeparator[1]) {
      const num = parseInt(matchNoSeparator[1], 10);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  /**
   * Ordena chaves dinamicamente baseado no conteúdo do JSONB
   * Ordem: metadados -> fases (ordenadas por número) -> outras seções (ordem original) -> memoria_conversacional
   */
  const getSortedKeys = (obj: ExtractedData): string[] => {
    const keys = Object.keys(obj);
    
    // Seções especiais conhecidas (sempre primeiro e último)
    const specialSections = {
      first: ['metadados'],
      last: ['memoria_conversacional'],
    };

    // Separar chaves em categorias
    const metadataKeys: string[] = [];
    const phaseKeys: Array<{ key: string; num: number | null; originalIndex: number }> = [];
    const otherKeys: Array<{ key: string; originalIndex: number }> = [];
    const memoryKeys: string[] = [];

    keys.forEach((key, index) => {
      if (specialSections.first.includes(key.toLowerCase())) {
        metadataKeys.push(key);
      } else if (specialSections.last.includes(key.toLowerCase())) {
        memoryKeys.push(key);
      } else if (isPhaseKey(key)) {
        const phaseNum = extractPhaseNumber(key);
        phaseKeys.push({ key, num: phaseNum, originalIndex: index });
      } else {
        otherKeys.push({ key, originalIndex: index });
      }
    });

    // Ordenar apenas fases por número (ordem numérica crescente: 1, 2, 3...)
    phaseKeys.sort((a, b) => {
      // Se ambas têm número, ordenar numericamente (1, 2, 3...)
      if (a.num !== null && b.num !== null) {
        return a.num - b.num;
      }
      // Fases com número vêm antes das sem número
      if (a.num !== null && b.num === null) {
        return -1;
      }
      if (a.num === null && b.num !== null) {
        return 1;
      }
      // Se nenhuma tem número, manter ordem original
      return a.originalIndex - b.originalIndex;
    });

    // Manter outras seções na ordem original (não ordenar alfabeticamente)
    otherKeys.sort((a, b) => a.originalIndex - b.originalIndex);

    // Combinar na ordem correta
    return [
      ...metadataKeys,
      ...phaseKeys.map(p => p.key),
      ...otherKeys.map(o => o.key),
      ...memoryKeys,
    ];
  };

  // Prevent hydration errors by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Resumo da Conversa
          </DialogTitle>
          <DialogDescription>
            Dados extraídos e resumo das interações com o cliente
          </DialogDescription>
          <div className="pt-4">
            <Button
              onClick={handleCopyToClipboard}
              disabled={!data || isLoading}
              variant="outline"
              size="sm"
              className="gap-2 w-full"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar dados
                </>
              )}
            </Button>
          </div>
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
              {data.metadados && (
                <div key="metadados">
                  {renderSection('metadados', data.metadados)}
                </div>
              )}

              {/* Seções dinâmicas (fases e outras) - ordenadas dinamicamente */}
              {(() => {
                const sortedKeys = getSortedKeys(data);
                // Filtrar metadados e memoria_conversacional (já renderizados separadamente)
                const filteredKeys = sortedKeys.filter(key => 
                  key.toLowerCase() !== 'metadados' && 
                  key.toLowerCase() !== 'memoria_conversacional'
                );
                
                
                return filteredKeys.map(key => {
                  const section = renderSection(key, data[key]);
                  if (!section) return null;
                  return (
                    <div key={key}>
                      {section}
                    </div>
                  );
                });
              })()}

              {/* Memória Conversacional */}
              {data.memoria_conversacional && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Memória Conversacional
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/50">
                    {data.memoria_conversacional.resumo_acumulado && (
                      <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                        <SafeValue value={data.memoria_conversacional.resumo_acumulado} />
                      </p>
                    )}
                    {data.memoria_conversacional.pendencias_abertas &&
                     Array.isArray(data.memoria_conversacional.pendencias_abertas) &&
                     data.memoria_conversacional.pendencias_abertas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/50">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                          Pendências:
                        </span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {data.memoria_conversacional.pendencias_abertas.map((item, idx) => (
                            <li key={idx}>
                              <SafeValue value={item} />
                            </li>
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
