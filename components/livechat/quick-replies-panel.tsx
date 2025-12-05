'use client';

import { useState } from 'react';
import { Zap, Search, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from '@/components/ui/command';
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
import { QuickReplyDialog } from './quick-reply-dialog';
import { replaceQuickReplyVariables } from '@/lib/utils/quick-replies';
import { useQuickRepliesCache } from '@/hooks/use-quick-replies-cache';
import { toast } from 'sonner';
import type { QuickReply } from '@/types/livechat';
import { useApiCall } from '@/lib/hooks';

interface QuickRepliesPanelProps {
  conversationId: string;
  tenantId: string;
  contactName: string;
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickRepliesPanel({
  conversationId,
  tenantId,
  contactName,
  onSelect,
  disabled = false,
}: QuickRepliesPanelProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Estados para dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingReply, setDeletingReply] = useState<QuickReply | null>(null);

  // API calls hooks
  const trackUsage = useApiCall('/api/quick-replies/usage', 'POST', {
    suppressSuccessToast: true,
    suppressErrorToast: true, // Fire-and-forget, não mostrar erro ao usuário
  });

  const deleteQuickReply = useApiCall(`/api/quick-replies/${deletingReply?.id}`, 'DELETE', {
    successMessage: 'Quick reply deletada com sucesso!',
    errorMessage: 'Erro ao deletar quick reply',
    onSuccess: () => {
      refetch(); // Invalida cache e recarrega
      setDeleteDialogOpen(false);
      setDeletingReply(null);
    },
  });

  // Hook otimizado com cache (reutiliza cache do QuickReplyCommand!)
  const {
    quickReplies: allQuickReplies,
    isLoading,
    refetch,
  } = useQuickRepliesCache({
    tenantId,
    enabled: open, // Só carrega quando popover está aberto
    onError: (error) => {
      console.error('Erro ao carregar quick replies:', error);
      toast.error('Erro ao carregar quick replies');
    },
  });

  // Filtra quick replies localmente (filtro client-side)
  const quickReplies = search.trim()
    ? allQuickReplies.filter(
        (reply) =>
          reply.title.toLowerCase().includes(search.toLowerCase()) ||
          reply.content.toLowerCase().includes(search.toLowerCase())
      )
    : allQuickReplies;

  const handleSelect = (quickReply: QuickReply) => {
    // Substituir variáveis dinâmicas
    const processedMessage = replaceQuickReplyVariables(quickReply.content, {
      contactName,
      conversationId,
    });

    // Inserir mensagem no input
    onSelect(processedMessage);

    // Incrementar contador de uso (fire-and-forget)
    trackUsage.execute({
      quickReplyId: quickReply.id,
      tenantId,
    });

    // Fechar popover
    setOpen(false);
    setSearch('');
  };

  // Handler para abrir dialog de criar
  const handleOpenCreateDialog = () => {
    setEditingReply(null);
    setDialogOpen(true);
  };

  // Handler para abrir dialog de editar
  const handleOpenEditDialog = (quickReply: QuickReply) => {
    setEditingReply(quickReply);
    setDialogOpen(true);
  };

  // Handler para fechar dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReply(null);
  };

  // Handler de sucesso (criar/editar)
  const handleSuccess = () => {
    refetch(); // Invalida cache e recarrega
  };

  // Handler para abrir dialog de deletar
  const handleOpenDeleteDialog = (quickReply: QuickReply) => {
    setDeletingReply(quickReply);
    setDeleteDialogOpen(true);
  };

  // Handler para deletar
  const handleDelete = async () => {
    if (!deletingReply) return;
    await deleteQuickReply.execute();
  };

  // Top 3 mais usadas (usa allQuickReplies pois já estão ordenados por usage_count)
  const top3Ids = allQuickReplies
    .slice(0, 3)
    .map((reply) => reply.id);

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Quick Replies (Respostas Rápidas)"
          className="h-[60px] w-[60px]"
        >
          <Zap className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        side="top"
      >
        <Command shouldFilter={false}>
          {/* Header com título e botão adicionar */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <h3 className="text-sm font-semibold">Quick Replies</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCreateDialog();
              }}
              title="Adicionar nova quick reply"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Campo de busca */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 opacity-50" />
            <input
              placeholder="Buscar quick reply..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : quickReplies.length === 0 ? (
              <CommandEmpty>
                {search
                  ? 'Nenhuma resposta rápida encontrada.'
                  : 'Nenhuma resposta rápida cadastrada.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {quickReplies.map((reply) => {
                  const isPopular = top3Ids.includes(reply.id);

                  return (
                    <div
                      key={reply.id}
                      className="relative flex items-start gap-2 px-2 py-3 hover:bg-accent cursor-pointer group"
                      onClick={() => handleSelect(reply)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {reply.emoji && (
                            <span className="text-lg">{reply.emoji}</span>
                          )}
                          <span className="font-medium text-sm truncate">
                            {reply.title}
                          </span>
                          {isPopular && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {reply.content}
                        </p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Usado {reply.usage_count}x
                        </div>
                      </div>

                      {/* Menu ellipsis */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(reply);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteDialog(reply);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    {/* Dialog de criar/editar quick reply */}
    <QuickReplyDialog
      open={dialogOpen}
      onOpenChange={handleCloseDialog}
      quickReply={editingReply}
      tenantId={tenantId}
      onSuccess={handleSuccess}
    />

    {/* Dialog de confirmação de exclusão */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a quick reply &quot;{deletingReply?.title}&quot;?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteQuickReply.isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteQuickReply.isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteQuickReply.isLoading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
