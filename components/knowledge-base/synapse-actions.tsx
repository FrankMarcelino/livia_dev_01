'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SynapseDialog } from './synapse-dialog';
import { DeleteSynapseDialog } from './delete-synapse-dialog';
import type { Synapse } from '@/types/knowledge-base';

interface SynapseActionsProps {
  synapse: Synapse;
  tenantId: string;
  baseConhecimentoId: string;
  onSuccess?: () => void; // Callback para quando operação tem sucesso
}

/**
 * Dropdown de ações para uma synapse (editar, deletar)
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia ações da synapse
 * - Open/Closed: Aceita callback para extensibilidade
 */
export function SynapseActions({
  synapse,
  tenantId,
  baseConhecimentoId,
  onSuccess,
}: SynapseActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SynapseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenantId={tenantId}
        baseConhecimentoId={baseConhecimentoId}
        synapse={synapse}
        onSuccess={onSuccess}
      />

      <DeleteSynapseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        synapse={synapse}
        tenantId={tenantId}
        onSuccess={onSuccess}
      />
    </>
  );
}
