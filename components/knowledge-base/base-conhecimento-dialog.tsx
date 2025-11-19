'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createBaseConhecimentoAction,
  updateBaseConhecimentoAction,
} from '@/app/actions/base-conhecimento';
import { SynapsesTable } from './synapses-table';
import type { BaseConhecimento, Synapse } from '@/types/knowledge-base';

interface BaseConhecimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
  base?: BaseConhecimento; // Se fornecido, está editando
}

/**
 * Dialog para criar ou editar base de conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Gerencia formulário de base + exibição de synapses
 * - Open/Closed: Extensível via props
 * - Dependency Inversion: Usa queries abstraídas
 *
 * Features:
 * - Modo criar/editar
 * - Select NeuroCore disabled (informativo)
 * - Tabela de synapses aninhada (quando editando)
 * - Estado local de synapses (não fecha dialog ao criar/editar synapse)
 */
export function BaseConhecimentoDialog({
  open,
  onOpenChange,
  tenantId,
  neurocoreId,
  neurocoreName,
  base,
}: BaseConhecimentoDialogProps) {
  const router = useRouter();
  const isEditing = !!base;

  const [name, setName] = useState(base?.name || '');
  const [description, setDescription] = useState(base?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [loadingSynapses, setLoadingSynapses] = useState(false);

  // Carregar synapses quando editando uma base
  useEffect(() => {
    if (open && isEditing && base) {
      loadSynapses();
    }
  }, [open, isEditing, base]);

  const loadSynapses = async () => {
    if (!base) return;

    setLoadingSynapses(true);
    try {
      const response = await fetch(`/api/bases/${base.id}/synapses`);

      if (!response.ok) {
        throw new Error('Erro ao buscar synapses');
      }

      const { synapses: data } = await response.json();
      setSynapses(data);
    } catch (error) {
      toast.error('Erro ao carregar synapses');
      console.error('Erro ao carregar synapses:', error);
    } finally {
      setLoadingSynapses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (name.trim().length < 3) {
      toast.error('Nome deve ter no mínimo 3 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const result = isEditing
        ? await updateBaseConhecimentoAction(base!.id, tenantId, {
            name,
            description: description.trim() || null,
          })
        : await createBaseConhecimentoAction(tenantId, neurocoreId, {
            name,
            description: description.trim() || undefined,
          });

      if (result.success) {
        toast.success(
          isEditing
            ? 'Base atualizada!'
            : 'Base de conhecimento criada com sucesso!'
        );
        onOpenChange(false);
        router.refresh();

        // Limpar form se for criação
        if (!isEditing) {
          setName('');
          setDescription('');
        }
      } else {
        toast.error(result.error || 'Erro ao salvar base de conhecimento');
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Base de Conhecimento' : 'Nova Base de Conhecimento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da base e gerencie suas synapses'
              : 'Crie uma nova base para organizar synapses relacionadas'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Políticas de Devolução"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Nome temático para organizar synapses relacionadas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo desta base..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neurocore">NeuroCore Associado</Label>
              <Select value={neurocoreId} disabled>
                <SelectTrigger id="neurocore">
                  <SelectValue placeholder={neurocoreName} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={neurocoreId}>{neurocoreName}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Base vinculada ao NeuroCore do seu tenant (não editável)
              </p>
            </div>
          </div>

          {/* Synapses Section (só aparece quando editando) */}
          {isEditing && base && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold">Synapses Relacionadas</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie as synapses que pertencem a esta base
                </p>
              </div>

              {loadingSynapses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SynapsesTable
                  synapses={synapses}
                  tenantId={tenantId}
                  baseConhecimentoId={base.id}
                  onSynapseChange={loadSynapses}
                />
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Base'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
