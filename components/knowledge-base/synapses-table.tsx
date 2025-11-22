'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getSynapseStatusBadge } from '@/lib/utils/synapse-status';
import { toggleSynapseEnabledAction } from '@/app/actions/synapses';
import { SynapseDialog, SynapseActions } from '@/components/knowledge-base';
import type { Synapse } from '@/types/knowledge-base';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SynapsesTableProps {
  synapses: Synapse[];
  tenantId: string;
  baseConhecimentoId: string;
  onSynapseChange?: () => void; // Callback para quando synapse muda (criar/editar/deletar)
}

/**
 * Tabela de synapses com funcionalidades interativas
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza e gerencia tabela de synapses
 * - Open/Closed: Aceita callback onSynapseChange para extensibilidade
 */
export function SynapsesTable({
  synapses,
  tenantId,
  baseConhecimentoId,
  onSynapseChange,
}: SynapsesTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (synapse: Synapse) => {
    setTogglingId(synapse.id);

    try {
      const result = await toggleSynapseEnabledAction(
        synapse.id,
        tenantId,
        !synapse.is_enabled
      );

      if (result.success) {
        toast.success(
          synapse.is_enabled
            ? 'Synapse desativada'
            : 'Synapse ativada! n8n processará em breve'
        );

        // Se callback fornecido, chamar (ex: refresh dados no dialog)
        if (onSynapseChange) {
          onSynapseChange();
        } else {
          // Fallback: refresh page
          router.refresh();
        }
      } else {
        toast.error(result.error || 'Erro ao atualizar synapse');
      }
    } catch (_error) {
      toast.error('Erro inesperado');
    } finally {
      setTogglingId(null);
    }
  };

  if (synapses.length === 0) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <div className="text-center space-y-2 py-12">
            <h2 className="text-xl font-semibold">Nenhuma synapse criada</h2>
            <p className="text-muted-foreground">
              Comece criando sua primeira synapse
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Synapse
            </Button>
          </div>
        </div>

        <SynapseDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          tenantId={tenantId}
          baseConhecimentoId={baseConhecimentoId}
          onSuccess={onSynapseChange}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Ativa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {synapses.map((synapse) => (
              <TableRow key={synapse.id}>
                <TableCell className="font-medium">{synapse.title}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  {synapse.description || '—'}
                </TableCell>
                <TableCell>{getSynapseStatusBadge(synapse.status)}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={synapse.is_enabled}
                    onCheckedChange={() => handleToggle(synapse)}
                    disabled={togglingId === synapse.id}
                    aria-label="Ativar synapse"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <SynapseActions
                    synapse={synapse}
                    tenantId={tenantId}
                    baseConhecimentoId={baseConhecimentoId}
                    onSuccess={onSynapseChange}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SynapseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tenantId={tenantId}
        baseConhecimentoId={baseConhecimentoId}
        onSuccess={onSynapseChange}
      />
    </>
  );
}
