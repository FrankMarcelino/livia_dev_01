'use client';

import { useState } from 'react';
import { BaseConhecimentoTable, BaseConhecimentoDialog } from '@/components/knowledge-base';
import type { BaseConhecimentoWithCount } from '@/types/knowledge-base';

interface KnowledgeBaseContainerProps {
  bases: BaseConhecimentoWithCount[];
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
}

/**
 * Container cliente para gerenciar estado do dialog de Base de Conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia estado do dialog
 * - Open/Closed: Componentes internos são extensíveis
 */
export function KnowledgeBaseContainer({
  bases,
  tenantId,
  neurocoreId,
  neurocoreName,
}: KnowledgeBaseContainerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBaseId, setSelectedBaseId] = useState<string | undefined>();

  const handleOpenDialog = (baseId?: string) => {
    setSelectedBaseId(baseId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBaseId(undefined);
  };

  // Buscar base selecionada
  const selectedBase = selectedBaseId
    ? bases.find((b) => b.id === selectedBaseId)
    : undefined;

  return (
    <>
      <BaseConhecimentoTable
        bases={bases}
        tenantId={tenantId}
        neurocoreName={neurocoreName}
        onOpenDialog={handleOpenDialog}
      />

      <BaseConhecimentoDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        tenantId={tenantId}
        neurocoreId={neurocoreId}
        neurocoreName={neurocoreName}
        base={selectedBase}
      />
    </>
  );
}
