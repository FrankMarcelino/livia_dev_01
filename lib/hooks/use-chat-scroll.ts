'use client';

/**
 * Hook: useChatScroll
 *
 * Gerencia comportamento de scroll inteligente para chat:
 * - Auto-scroll apenas se usuário está no final
 * - Detecta quando usuário rola para cima
 * - Conta novas mensagens não lidas
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseChatScrollOptions {
  /** Threshold em pixels para considerar "no final" */
  threshold?: number;
  /** Comportamento do scroll (auto, smooth, instant) */
  behavior?: ScrollBehavior;
}

export function useChatScroll<T>(
  messages: T[],
  options: UseChatScrollOptions = {}
) {
  const { threshold = 150, behavior = 'smooth' } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousMessageCount = useRef(messages.length);

  // Rola para o final
  const scrollToBottom = useCallback((instantScroll = false) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: instantScroll ? 'instant' : behavior,
    });

    setUnreadCount(0);
  }, [behavior]);

  // Adiciona listener de scroll
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom < threshold;

      setIsAtBottom(atBottom);

      if (atBottom) {
        setUnreadCount(0);
      }
    };

    element.addEventListener('scroll', handleScroll);

    // Verifica estado inicial
    handleScroll();

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  // Auto-scroll quando novas mensagens chegam ou conversa muda
  useEffect(() => {
    const newMessageCount = messages.length - previousMessageCount.current;

    // Se a contagem de mensagens diminuiu, é uma nova conversa
    if (newMessageCount < 0) {
      // Nova conversa - reseta e faz scroll ao final
      setUnreadCount(0);
      setIsAtBottom(true);
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    } else if (newMessageCount > 0) {
      // Novas mensagens na conversa atual
      if (isAtBottom) {
        // Se está no final, faz scroll automático após renderização
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      } else {
        // Se não está no final, incrementa contador
        setUnreadCount((prev) => prev + newMessageCount);
      }
    }

    previousMessageCount.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  // Scroll inicial ao montar (sem animação)
  useEffect(() => {
    // Aguarda renderização completa
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  return {
    scrollRef,
    isAtBottom,
    unreadCount,
    scrollToBottom,
  };
}
