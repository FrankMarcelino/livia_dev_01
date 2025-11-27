-- Migration: Adicionar campo ai_paused à tabela users
-- Descrição: Permite que usuários pausem a IA (assistente virtual não responderá automaticamente)
-- Data: 2025-11-26

-- Adiciona coluna ai_paused (padrão: false - IA ativa)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT false NOT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN users.ai_paused IS 'Indica se a IA está pausada para este usuário. Se true, a IA não responderá automaticamente às mensagens.';
