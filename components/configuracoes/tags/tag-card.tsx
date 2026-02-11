'use client';

import type { TagForManagement } from '@/lib/queries/tags-crud';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TagCardProps {
  tag: TagForManagement;
  onEdit: (tag: TagForManagement) => void;
  onDeleted: () => void;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] ?? '00', 16),
        g: parseInt(result[2] ?? '00', 16),
        b: parseInt(result[3] ?? '00', 16),
      }
    : { r: 59, g: 130, b: 246 };
}

export function TagCard({ tag, onEdit, onDeleted }: TagCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const rgb = hexToRgb(tag.color || '#3B82F6');
  const bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/configuracoes/tags/${tag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao deletar tag');
      }

      toast.success('Tag deletada com sucesso');
      onDeleted();
      setShowDeleteDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar tag';
      toast.error('Erro ao deletar', { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
        style={{ borderLeftColor: tag.color, borderLeftWidth: '3px' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Color dot */}
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: tag.color }}
          />

          {/* Name + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{tag.tag_name}</span>
              {tag.isInherited && (
                <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                  <Shield className="h-3 w-3" />
                  Neurocore
                </Badge>
              )}
              {tag.active === false && (
                <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                  Inativo
                </Badge>
              )}
            </div>
            {tag.prompt_to_ai && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {tag.prompt_to_ai}
              </p>
            )}
          </div>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
            style={{
              backgroundColor: bgColor,
              borderColor: borderColor,
              color: tag.color,
            }}
          >
            {tag.tag_type === 'description'
              ? 'Intenção'
              : tag.tag_type === 'success'
              ? 'Checkout'
              : tag.tag_type === 'fail'
              ? 'Falha'
              : tag.tag_type}
          </span>

          {/* Actions (only for tenant tags) */}
          {!tag.isInherited && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(tag)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a tag &quot;{tag.tag_name}&quot;? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
