'use client';

import { useState, useCallback } from 'react';
import { DomainCarousel } from './domain-carousel';
import { DomainBasesAccordion } from './domain-bases-accordion';
import { BaseConhecimentoFormDialog } from './base-conhecimento-form-dialog';
import { DeleteBaseDialog } from './delete-base-dialog';
import { SearchInput } from './search-input';
import { toast } from 'sonner';
import {
  deleteBaseConhecimentoAction,
  toggleBaseActiveAction,
  searchBaseConhecimentoAction,
} from '@/app/actions/base-conhecimento';
import type {
  DomainWithCount,
  BaseConhecimento,
  KnowledgeDomain,
  BaseConhecimentoWithDomain,
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

  const [togglingBaseId, setTogglingBaseId] = useState<string | null>(null);

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BaseConhecimentoWithDomain[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);
  const basesInDomain = selectedDomainId ? basesByDomain[selectedDomainId] || [] : [];

  // Determinar se está em modo de busca
  const isSearchMode = searchTerm.trim().length >= 2;

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
    setTogglingBaseId(baseId);

    try {
      const result = await toggleBaseActiveAction(baseId, tenantId, isActive);

      if (result.success) {
        toast.success(isActive ? 'Base ativada!' : 'Base desativada!');
        // Recarregar página
        window.location.reload();
      } else {
        console.error('[Toggle] Erro:', result.error);
        toast.error(result.error || 'Erro ao atualizar base');
        setTogglingBaseId(null);
      }
    } catch (error) {
      console.error('[Toggle] Exceção:', error);
      toast.error('Erro inesperado ao atualizar base');
      setTogglingBaseId(null);
    }
  };

  const handleFormSuccess = () => {
    // Recarregar página para mostrar dados atualizados
    window.location.reload();
  };

  // Handler de busca
  const handleSearch = useCallback(
    async (term: string) => {
      setSearchTerm(term);
      setSearchError(null);

      // Se termo vazio ou muito curto, limpar resultados
      if (term.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const result = await searchBaseConhecimentoAction(tenantId, term);

        if (result.success && result.data) {
          setSearchResults(result.data);
        } else {
          setSearchError(result.error || 'Erro ao buscar');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('[Search] Erro:', error);
        setSearchError('Erro inesperado ao buscar');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [tenantId]
  );

  // Agrupar resultados de busca por domínio
  const searchResultsByDomain: Record<string, BaseConhecimento[]> = {};
  const searchDomains: DomainWithCount[] = [];

  if (isSearchMode && searchResults.length > 0) {
    searchResults.forEach((base) => {
      const domainId = base.domain;
      if (!domainId) return; // Skip bases without domain
      
      if (!searchResultsByDomain[domainId]) {
        searchResultsByDomain[domainId] = [];
        // Adicionar informações do domínio
        if (base.knowledge_domains) {
          searchDomains.push({
            ...base.knowledge_domains,
            bases_count: 0,
            published_count: 0,
            processing_count: 0,
          });
        }
      }
      searchResultsByDomain[domainId].push(base);
    });

    // Atualizar contagens
    searchDomains.forEach((domain) => {
      const bases = searchResultsByDomain[domain.id] || [];
      domain.bases_count = bases.length;
    });
  }

  return (
    <div className="space-y-6">
      {/* Campo de Busca */}
      <SearchInput onSearch={handleSearch} isLoading={isSearching} />

      {/* Modo Busca */}
      {isSearchMode ? (
        <div className="space-y-4">
          {/* Header de Resultados */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isSearching
                ? 'Buscando...'
                : searchResults.length > 0
                ? `${searchResults.length} ${
                    searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'
                  } para "${searchTerm}"`
                : 'Nenhum resultado encontrado'}
            </h3>
          </div>

          {/* Erro de Busca */}
          {searchError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {searchError}
            </div>
          )}

          {/* Resultados por Domínio */}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-6">
              {searchDomains.map((domain) => {
                const bases = searchResultsByDomain[domain.id] || [];
                if (bases.length === 0) return null;

                return (
                  <div key={domain.id} className="space-y-2">
                    <DomainBasesAccordion
                      bases={bases}
                      domainName={domain.domain}
                      onEditBase={handleEditBase}
                      onDeleteBase={handleDeleteBase}
                      onToggleActive={handleToggleActive}
                      togglingBaseId={togglingBaseId}
                      searchMode={true}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {!isSearching && searchResults.length === 0 && !searchError && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma base encontrada para &quot;{searchTerm}&quot;
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente usar outros termos de busca
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
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
              togglingBaseId={togglingBaseId}
            />
          )}
        </>
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
