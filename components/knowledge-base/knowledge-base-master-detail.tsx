'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BaseConhecimentoCarousel } from './base-conhecimento-carousel';
import { BaseConhecimentoFormDialog } from './base-conhecimento-form-dialog';
import { SynapsesTable } from './synapses-table';
import { SynapseDialog } from './synapse-dialog';
import { toggleBaseConhecimentoActiveAction } from '@/app/actions/base-conhecimento';
import type { BaseConhecimentoWithCount, Synapse } from '@/types/knowledge-base';

interface KnowledgeBaseMasterDetailProps {
  bases: BaseConhecimentoWithCount[];
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
}

/**
 * Layout completo master-detail para Base de Conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Orquestra master-detail, não renderiza diretamente
 * - Open/Closed: Componentes filhos extensíveis
 * - Dependency Inversion: Usa API route abstrata
 *
 * Features:
 * - Gerencia estado da base selecionada
 * - Carrega synapses via API quando base é selecionada
 * - Renderiza BaseConhecimentoCarousel (master)
 * - Renderiza SynapsesTable (detail) quando base selecionada
 * - Renderiza BaseConhecimentoFormDialog
 * - Renderiza SynapseDialog
 */
export function KnowledgeBaseMasterDetail({
  bases: initialBases,
  tenantId,
  neurocoreId,
  neurocoreName,
}: KnowledgeBaseMasterDetailProps) {
  const router = useRouter();

  const [bases, setBases] = useState(initialBases);
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [loadingSynapses, setLoadingSynapses] = useState(false);
  const [baseDialogOpen, setBaseDialogOpen] = useState(false);
  const [synapseDialogOpen, setSynapseDialogOpen] = useState(false);

  const selectedBase = selectedBaseId
    ? bases.find((b) => b.id === selectedBaseId)
    : null;

  // Carregar synapses quando base é selecionada
  const handleSelectBase = async (baseId: string) => {
    setSelectedBaseId(baseId);
    setLoadingSynapses(true);

    try {
      const response = await fetch(`/api/bases/${baseId}/synapses`);

      if (!response.ok) {
        throw new Error('Erro ao buscar synapses');
      }

      const { synapses: data } = await response.json();
      setSynapses(data);
    } catch (error) {
      toast.error('Erro ao carregar synapses');
      console.error('Erro ao carregar synapses:', error);
      setSynapses([]);
    } finally {
      setLoadingSynapses(false);
    }
  };

  // Toggle base ativa/inativa
  const handleToggleActive = async (baseId: string, isActive: boolean) => {
    try {
      const result = await toggleBaseConhecimentoActiveAction(baseId, tenantId, isActive);

      if (result.success) {
        toast.success(isActive ? 'Base ativada!' : 'Base desativada!');

        // Atualizar estado local
        setBases((prev) =>
          prev.map((b) => (b.id === baseId ? { ...b, is_active: isActive } : b))
        );
      } else {
        toast.error(result.error || 'Erro ao atualizar base');
      }
    } catch (error) {
      toast.error('Erro inesperado ao atualizar base');
    }
  };

  // Callback quando base é criada/editada
  const handleBaseSuccess = () => {
    router.refresh();
    // Recarregar bases do servidor
    // Note: router.refresh() vai atualizar o initialBases via Server Component
  };

  // Callback quando synapse é criada/editada/deletada
  const handleSynapseChange = async () => {
    if (selectedBaseId) {
      // Recarregar synapses da base selecionada
      await handleSelectBase(selectedBaseId);
    }
  };

  return (
    <div className="space-y-8 w-full overflow-x-hidden">
      {/* Master: Carousel de Bases */}
      <BaseConhecimentoCarousel
        bases={bases}
        selectedBaseId={selectedBaseId}
        onSelectBase={handleSelectBase}
        onToggleActive={handleToggleActive}
        onOpenCreateDialog={() => setBaseDialogOpen(true)}
      />

      {/* Detail: Synapses da Base Selecionada */}
      {selectedBaseId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Synapses: {selectedBase?.name}
              </h3>
              {!selectedBase?.is_active && (
                <p className="text-sm text-destructive mt-1">
                  Base inativa - Synapses não serão usadas pela IA
                </p>
              )}
            </div>
          </div>

          {loadingSynapses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SynapsesTable
              synapses={synapses}
              tenantId={tenantId}
              baseConhecimentoId={selectedBaseId}
              onSynapseChange={handleSynapseChange}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <BaseConhecimentoFormDialog
        open={baseDialogOpen}
        onOpenChange={setBaseDialogOpen}
        tenantId={tenantId}
        neurocoreId={neurocoreId}
        neurocoreName={neurocoreName}
        onSuccess={handleBaseSuccess}
      />

      {selectedBaseId && (
        <SynapseDialog
          open={synapseDialogOpen}
          onOpenChange={setSynapseDialogOpen}
          tenantId={tenantId}
          baseConhecimentoId={selectedBaseId}
          onSuccess={handleSynapseChange}
        />
      )}
    </div>
  );
}
