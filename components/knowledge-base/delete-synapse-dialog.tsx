'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSynapseAction } from '@/app/actions/synapses';
import type { Synapse } from '@/types/knowledge-base';

interface DeleteSynapseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  synapse: Synapse;
  tenantId: string;
  onSuccess?: () => void; // Callback chamado após sucesso (opcional)
}

/**
 * Dialog de confirmação para deletar synapse
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas confirma e deleta synapse
 * - Open/Closed: Extensível via callback onSuccess
 * - Dependency Inversion: Aceita callback abstrato
 */
export function DeleteSynapseDialog({
  open,
  onOpenChange,
  synapse,
  tenantId,
  onSuccess,
}: DeleteSynapseDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteSynapseAction(synapse.id, tenantId);

      if (result.success) {
        toast.success('Synapse deletada com sucesso!');
        onOpenChange(false);

        // Se callback fornecido, chamar (ex: refresh dados no dialog pai)
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback: refresh page
          router.refresh();
        }
      } else {
        toast.error(result.error || 'Erro ao deletar synapse');
      }
    } catch (error) {
      toast.error('Erro inesperado ao deletar synapse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Synapse</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar{' '}
            <strong className="text-foreground">{synapse.title}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. A synapse e seus embeddings serão
            removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
