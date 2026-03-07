-- Migration: Tag - Pausar IA ao aplicar
-- Adiciona coluna pause_ia_on_apply na tabela tags
-- Quando true, ao aplicar a tag a uma conversa, a IA será pausada automaticamente

ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS pause_ia_on_apply boolean DEFAULT false;
