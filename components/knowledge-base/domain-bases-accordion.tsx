'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2 } from 'lucide-react';
import { getBaseStatus } from '@/types/knowledge-base';
import type { BaseConhecimento } from '@/types/knowledge-base';

interface DomainBasesAccordionProps {
  bases: BaseConhecimento[];
  domainName: string;
  onEditBase: (base: BaseConhecimento) => void;
  onDeleteBase: (baseId: string) => void;
  onToggleActive: (baseId: string, isActive: boolean) => void;
  togglingBaseId: string | null;
}

/**
 * Accordion com lista de bases de conhecimento de um domínio
 *
 * Features:
 * - Accordion expansível para cada base
 * - Header: nome + status badge + ações
 * - Content: conteúdo completo da base
 * - Toggle para ativar/desativar (sazonal)
 * - Primeiro item aberto por padrão
 */
export function DomainBasesAccordion({
  bases,
  domainName,
  onEditBase,
  onDeleteBase,
  onToggleActive,
  togglingBaseId,
}: DomainBasesAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(
    bases.length > 0 && bases[0] ? [bases[0].id] : []
  );

  if (bases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma base de conhecimento em {domainName}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Clique em &quot;Nova Base&quot; para criar a primeira base deste domínio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {domainName} - {bases.length} {bases.length === 1 ? 'base' : 'bases'} de conhecimento
        </h3>
      </div>

      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="w-full space-y-2"
      >
        {bases.map((base) => {
          const statusInfo = getBaseStatus(base);
          const canEdit = statusInfo.status !== 'processing';

          // Permitir toggle exceto quando está processando (criação inicial)
          const canToggle = statusInfo.status !== 'processing';
          const isToggleDisabled = !canToggle || togglingBaseId === base.id;

          return (
            <AccordionItem
              key={base.id}
              value={base.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{statusInfo.icon}</span>
                    <div className="text-left">
                      <h4 className="font-semibold">{base.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            statusInfo.color as
                              | 'default'
                              | 'secondary'
                              | 'destructive'
                              | 'outline'
                          }
                        >
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Criado em{' '}
                          {new Date(base.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Toggle Ativo/Inativo */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {togglingBaseId === base.id
                          ? 'Processando...'
                          : base.is_active
                          ? 'Ativo'
                          : 'Inativo'}
                      </span>
                      <Switch
                        checked={base.is_active}
                        onCheckedChange={(checked) =>
                          onToggleActive(base.id, checked)
                        }
                        disabled={isToggleDisabled}
                        title={
                          statusInfo.status === 'processing'
                            ? 'Aguarde o processamento inicial para ativar'
                            : togglingBaseId === base.id
                            ? 'Processando toggle...'
                            : base.is_active
                            ? 'Desativar base (pausar uso sazonal)'
                            : !base.base_conhecimentos_vectors
                            ? 'Ativar base (sem vetor - N8N irá reprocessar)'
                            : 'Ativar base (reabilitar uso)'
                        }
                      />
                    </div>

                    {/* Botão Editar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBase(base);
                      }}
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? 'Editar base'
                          : 'Aguarde o processamento para editar'
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Botão Deletar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBase(base.id);
                      }}
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? 'Deletar base'
                          : 'Aguarde o processamento para deletar'
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-4 pt-2">
                <div className="space-y-3">
                  {/* Conteúdo da Base */}
                  <div className="rounded-md bg-muted/50 p-4">
                    <h5 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Conteúdo:
                    </h5>
                    <div className="text-sm whitespace-pre-wrap">
                      {base.description || (
                        <span className="text-muted-foreground italic">
                          Sem conteúdo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadados */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Atualizado em{' '}
                      {new Date(base.updated_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(base.updated_at).toLocaleTimeString('pt-BR')}
                    </span>
                    {base.base_conhecimentos_vectors && (
                      <span className="text-green-600">
                        ✓ Vetor: {base.base_conhecimentos_vectors.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
