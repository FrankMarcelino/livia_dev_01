'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSynapseAction,
  updateSynapseAction,
} from '@/app/actions/synapses';
import type { Synapse } from '@/types/knowledge-base';

interface SynapseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  baseConhecimentoId: string;
  synapse?: Synapse; // Se fornecido, está editando
  onSuccess?: () => void; // Callback chamado após sucesso (opcional)
}

/**
 * Dialog para criar ou editar synapse
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia formulário de synapse
 * - Open/Closed: Extensível via props (onSuccess callback), fechado para modificação
 * - Dependency Inversion: Aceita callback abstrato, não depende de implementação
 */
export function SynapseDialog({
  open,
  onOpenChange,
  tenantId,
  baseConhecimentoId,
  synapse,
  onSuccess,
}: SynapseDialogProps) {
  const router = useRouter();
  const isEditing = !!synapse;

  const [title, setTitle] = useState(synapse?.title || '');
  const [content, setContent] = useState(synapse?.content || '');
  const [description, setDescription] = useState(synapse?.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const result = isEditing
        ? await updateSynapseAction(synapse.id, tenantId, {
            title,
            content,
            description: description.trim() || null,
          })
        : await createSynapseAction(tenantId, baseConhecimentoId, {
            title,
            content,
            description: description.trim() || undefined,
          });

      if (result.success) {
        toast.success(
          isEditing ? 'Synapse atualizada!' : 'Synapse criada com sucesso!'
        );
        onOpenChange(false);

        // Se callback fornecido, chamar (ex: refresh dados no dialog pai)
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback: refresh page
          router.refresh();
        }

        // Limpar form se for criação
        if (!isEditing) {
          setTitle('');
          setContent('');
          setDescription('');
        }
      } else {
        toast.error(result.error || 'Erro ao salvar synapse');
      }
    } catch (_error) {
      toast.error('Erro inesperado ao salvar synapse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Synapse' : 'Nova Synapse'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da synapse'
              : 'Crie uma nova unidade de conhecimento para a IA'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Política de Devolução"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Conteúdo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo que a IA deve conhecer..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={8}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este conteúdo será usado pela IA para responder perguntas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Resumo ou contexto adicional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
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
              {isEditing ? 'Salvar Alterações' : 'Criar Synapse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
