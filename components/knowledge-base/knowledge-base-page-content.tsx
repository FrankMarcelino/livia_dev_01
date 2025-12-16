'use client';

import { useState } from 'react';
import { DomainCarousel } from './domain-carousel';
import { DomainBasesAccordion } from './domain-bases-accordion';
import { BaseConhecimentoFormDialog } from './base-conhecimento-form-dialog';
import { DeleteBaseDialog } from './delete-base-dialog';
import { toast } from 'sonner';
import {
  deleteBaseConhecimentoAction,
  toggleBaseActiveAction,
} from '@/app/actions/base-conhecimento';
import type {
  DomainWithCount,
  BaseConhecimento,
  KnowledgeDomain,
} from '@/types/knowledge-base';

interface KnowledgeBasePageContentProps {
  domains: DomainWithCount[];
  basesByDomain: Record<string, BaseConhecimento[]>;
  allDomains: KnowledgeDomain[];
  tenantId: string;
  neurocoreId: string;
}

/**
 * Componente client-side para página de Base de Conhecimento
 *
 * Gerencia:
 * - Seleção de domínio (carousel)
 * - Lista de bases do domínio (accordion)
 * - Dialogs de criar/editar/deletar
 * - Toggle ativo/inativo
 */
export function KnowledgeBasePageContent({
  domains,
  basesByDomain,
  allDomains,
  tenantId,
  neurocoreId,
}: KnowledgeBasePageContentProps) {
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    domains.length > 0 && domains[0] ? domains[0].id : null
  );

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<BaseConhecimento | undefined>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBase, setDeletingBase] = useState<BaseConhecimento | null>(null);

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);
  const basesInDomain = selectedDomainId ? basesByDomain[selectedDomainId] || [] : [];

  // Handlers
  const handleOpenCreateDialog = () => {
    setEditingBase(undefined);
    setFormDialogOpen(true);
  };

  const handleEditBase = (base: BaseConhecimento) => {
    setEditingBase(base);
    setFormDialogOpen(true);
  };

  const handleDeleteBase = (baseId: string) => {
    const base = basesInDomain.find((b) => b.id === baseId);
    if (base) {
      setDeletingBase(base);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBase) return;

    const result = await deleteBaseConhecimentoAction(deletingBase.id, tenantId);

    if (result.success) {
      toast.success('Base deletada com sucesso!');
      // Recarregar página
      window.location.reload();
    } else {
      toast.error(result.error || 'Erro ao deletar base');
    }
  };

  const handleToggleActive = async (baseId: string, isActive: boolean) => {
    const result = await toggleBaseActiveAction(baseId, tenantId, isActive);

    if (result.success) {
      toast.success(isActive ? 'Base ativada!' : 'Base desativada!');
      // Recarregar página
      window.location.reload();
    } else {
      toast.error(result.error || 'Erro ao atualizar base');
    }
  };

  const handleFormSuccess = () => {
    // Recarregar página para mostrar dados atualizados
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Carousel de Domínios */}
      <DomainCarousel
        domains={domains}
        selectedDomainId={selectedDomainId}
        onSelectDomain={setSelectedDomainId}
        onOpenCreateDialog={handleOpenCreateDialog}
      />

      {/* Lista de Bases do Domínio Selecionado */}
      {selectedDomain && (
        <DomainBasesAccordion
          bases={basesInDomain}
          domainName={selectedDomain.domain}
          onEditBase={handleEditBase}
          onDeleteBase={handleDeleteBase}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Dialog Criar/Editar */}
      <BaseConhecimentoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        tenantId={tenantId}
        neurocoreId={neurocoreId}
        domains={allDomains}
        selectedDomainId={selectedDomainId}
        base={editingBase}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog Deletar */}
      {deletingBase && (
        <DeleteBaseDialog
          open={deleteDialogOpen}
          baseName={deletingBase.name}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
