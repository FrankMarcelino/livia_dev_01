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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { toggleBaseConhecimentoActiveAction } from '@/app/actions/base-conhecimento';
import type { BaseConhecimentoWithCount } from '@/types/knowledge-base';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BaseConhecimentoTableProps {
  bases: BaseConhecimentoWithCount[];
  tenantId: string;
  neurocoreName: string;
  onOpenDialog: (baseId?: string) => void;
}

/**
 * Tabela de bases de conhecimento com funcionalidades interativas
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza e gerencia tabela de bases
 * - Open/Closed: Aceita callback onOpenDialog para extensibilidade
 */
export function BaseConhecimentoTable({
  bases,
  tenantId,
  neurocoreName,
  onOpenDialog,
}: BaseConhecimentoTableProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (base: BaseConhecimentoWithCount) => {
    setTogglingId(base.id);

    try {
      const result = await toggleBaseConhecimentoActiveAction(
        base.id,
        tenantId,
        !base.is_active
      );

      if (result.success) {
        toast.success(base.is_active ? 'Base inativada' : 'Base ativada!');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao atualizar base');
      }
    } catch (error) {
      toast.error('Erro inesperado');
    } finally {
      setTogglingId(null);
    }
  };

  if (bases.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center space-y-2 py-12">
          <h2 className="text-xl font-semibold">
            Nenhuma base de conhecimento criada
          </h2>
          <p className="text-muted-foreground">
            Comece criando sua primeira base para organizar synapses
          </p>
          <Button className="mt-4" onClick={() => onOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Base de Conhecimento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bases de Conhecimento
          </h2>
          <p className="text-muted-foreground">
            Organize synapses em bases temáticas para o {neurocoreName}
          </p>
        </div>
        <Button onClick={() => onOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Base
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Synapses</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bases.map((base) => (
              <TableRow key={base.id}>
                <TableCell className="font-medium">{base.name}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  {base.description || '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {base.synapses_count}{' '}
                    {base.synapses_count === 1 ? 'synapse' : 'synapses'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={base.is_active}
                    onCheckedChange={() => handleToggle(base)}
                    disabled={togglingId === base.id}
                    aria-label="Ativar base"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenDialog(base.id)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Ver/Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
