import { useState, useCallback } from 'react';

/**
 * Resultado retornado pelo hook useDialogState
 */
export interface UseDialogStateResult<T = any> {
  /** Indica se o dialog está aberto */
  isOpen: boolean;
  /** Dados associados ao dialog (ex: item sendo editado) */
  data: T | null;
  /** Abre o dialog (opcionalmente com dados) */
  open: (data?: T) => void;
  /** Fecha o dialog e limpa os dados */
  close: () => void;
  /** Atualiza os dados sem fechar o dialog */
  setData: (data: T | null) => void;
}

/**
 * Hook genérico para gerenciar estado de dialogs/modals de forma consistente.
 *
 * Elimina duplicação de código ao centralizar o padrão comum de:
 * - isOpen state
 * - data state
 * - open/close handlers
 *
 * Suporta TypeScript genérico para type-safe data handling.
 *
 * @example
 * ```tsx
 * // Dialog simples (sem data)
 * const dialog = useDialogState();
 * <Dialog open={dialog.isOpen} onOpenChange={dialog.close}>
 *   <Button onClick={dialog.open}>Open</Button>
 * </Dialog>
 *
 * // Dialog com data (ex: edição)
 * const editDialog = useDialogState<Synapse>();
 * <Button onClick={() => editDialog.open(synapse)}>Edit</Button>
 * {editDialog.data && <SynapseEditForm synapse={editDialog.data} />}
 * ```
 */
export function useDialogState<T = any>(
  initialOpen = false,
  initialData: T | null = null
): UseDialogStateResult<T> {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(initialData);

  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data to allow exit animations
    setTimeout(() => {
      setData(null);
    }, 150);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    setData,
  };
}
