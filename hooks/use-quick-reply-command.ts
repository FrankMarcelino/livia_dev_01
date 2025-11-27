import { useState, useCallback, useRef, useEffect } from 'react';

export type QuickReplyMode = 'all' | 'popular';

interface UseQuickReplyCommandProps {
  /**
   * Callback chamado quando o command deve ser aberto.
   * Recebe o modo e a posição onde o trigger ocorreu.
   */
  onShouldOpen?: (mode: QuickReplyMode, position: number) => void;

  /**
   * Callback para remover texto do textarea.
   * Recebe a posição inicial e quantos caracteres remover.
   */
  onRemoveText?: (start: number, length: number) => void;
}

interface UseQuickReplyCommandReturn {
  isOpen: boolean;
  mode: QuickReplyMode;
  triggerPosition: number;
  openCommand: (mode: QuickReplyMode, position: number) => void;
  closeCommand: () => void;
  handleTextareaInput: (value: string, selectionStart: number) => void;
}

/**
 * Hook para gerenciar o Command Palette de respostas rápidas.
 *
 * Detecta os triggers:
 * - "/" → Aguarda 300ms, se não houver outra "/" abre modo "all"
 * - "//" → Abre modo "popular" imediatamente
 *
 * Estratégia: Permite "/" ser digitado, mas monitora o input para detectar
 * o padrão e então remove os "/" antes de abrir o command.
 */
export function useQuickReplyCommand({
  onShouldOpen,
  onRemoveText,
}: UseQuickReplyCommandProps = {}): UseQuickReplyCommandReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<QuickReplyMode>('all');
  const [triggerPosition, setTriggerPosition] = useState(0);

  // Refs para rastreamento de "/" digitados
  const pendingSlashRef = useRef<{
    position: number;
    timeout: NodeJS.Timeout;
  } | null>(null);

  const openCommand = useCallback((newMode: QuickReplyMode, position: number) => {
    setMode(newMode);
    setTriggerPosition(position);
    setIsOpen(true);
    onShouldOpen?.(newMode, position);
  }, [onShouldOpen]);

  const closeCommand = useCallback(() => {
    setIsOpen(false);

    // Limpa timeout pendente
    if (pendingSlashRef.current) {
      clearTimeout(pendingSlashRef.current.timeout);
      pendingSlashRef.current = null;
    }
  }, []);

  const handleTextareaInput = useCallback(
    (value: string, selectionStart: number) => {
      const cursorPos = selectionStart;

      // Verifica se acabou de digitar "/"
      if (cursorPos > 0 && value[cursorPos - 1] === '/') {
        const charBeforeCursor = cursorPos > 1 ? value[cursorPos - 2] : '';

        // Verifica contexto válido (início ou após espaço/quebra)
        const isValidContext =
          cursorPos === 1 || charBeforeCursor === ' ' || charBeforeCursor === '\n';

        if (!isValidContext) {
          return; // Ignora "/" em meio a texto
        }

        // Verifica se é segunda "/" (forma "//")
        if (pendingSlashRef.current) {
          const { position, timeout } = pendingSlashRef.current;

          // Se a segunda "/" está imediatamente após a primeira
          if (position === cursorPos - 2) {
            clearTimeout(timeout);
            pendingSlashRef.current = null;

            // Remove ambos os "/"
            onRemoveText?.(position, 2);

            // Abre modo popular
            openCommand('popular', position);
            return;
          }
        }

        // Primeira "/" - agenda abertura do modo "all"
        const timeout = setTimeout(() => {
          if (pendingSlashRef.current) {
            const { position } = pendingSlashRef.current;
            pendingSlashRef.current = null;

            // Remove o "/"
            onRemoveText?.(position, 1);

            // Abre modo all
            openCommand('all', position);
          }
        }, 300);

        pendingSlashRef.current = {
          position: cursorPos - 1,
          timeout,
        };
      }
    },
    [openCommand, onRemoveText]
  );

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (pendingSlashRef.current) {
        clearTimeout(pendingSlashRef.current.timeout);
      }
    };
  }, []);

  return {
    isOpen,
    mode,
    triggerPosition,
    openCommand,
    closeCommand,
    handleTextareaInput,
  };
}
