'use client';

import { useState, useEffect } from 'react';
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
import type { BaseConhecimento } from '@/types/knowledge-base';

interface BaseConhecimentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
  base?: BaseConhecimento; // Se fornecido, está editando
  onSuccess: () => void;
}

/**
 * Dialog SIMPLES para criar ou editar base de conhecimento
 * (SEM synapses aninhadas - layout master-detail cuida disso)
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas form de base
 * - Open/Closed: Callback onSuccess
 * - Dependency Inversion: Não depende de router.refresh
 *
 * Features:
 * - Modo criar/editar
 * - Select NeuroCore disabled (informativo)
 * - Validação: nome min 3 chars
 */
export function BaseConhecimentoFormDialog({
  open,
  onOpenChange,
  tenantId,
  neurocoreId,
  neurocoreName,
  base,
  onSuccess,
}: BaseConhecimentoFormDialogProps) {
  const isEditing = !!base;

  const [name, setName] = useState(base?.name || '');
  const [description, setDescription] = useState(base?.description || '');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form quando dialog abre/fecha ou base muda
  useEffect(() => {
    if (open) {
      setName(base?.name || '');
      setDescription(base?.description || '');
    }
  }, [open, base]);

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
        onSuccess();

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Base de Conhecimento' : 'Nova Base de Conhecimento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da base'
              : 'Crie uma nova base para organizar synapses relacionadas'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
