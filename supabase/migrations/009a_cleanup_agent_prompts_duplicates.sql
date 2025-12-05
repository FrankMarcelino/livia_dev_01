-- Migration Parte 1: Identificar e Limpar Duplicatas em agent_prompts
-- Feature: Agent Templates - Meus Agentes IA
-- Date: 2025-12-04
-- 
-- Este script DEVE ser executado ANTES da migration 009

BEGIN;

-- 1. Identificar duplicatas (para auditoria)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id_agent, id_tenant, COUNT(*) as count
    FROM agent_prompts
    GROUP BY id_agent, id_tenant
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '=== DUPLICATAS ENCONTRADAS ===';
  RAISE NOTICE 'Total de combinações duplicadas: %', duplicate_count;
END $$;

-- 2. Mostrar detalhes das duplicatas
SELECT 
  id_agent,
  id_tenant,
  COUNT(*) as total_duplicates,
  array_agg(id ORDER BY created_at DESC) as duplicate_ids,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM agent_prompts
GROUP BY id_agent, id_tenant
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 3. Criar tabela temporária com registros a serem mantidos
-- Estratégia: Manter o registro mais RECENTE (created_at mais novo)
CREATE TEMP TABLE agent_prompts_to_keep AS
SELECT DISTINCT ON (id_agent, id_tenant) id
FROM agent_prompts
ORDER BY id_agent, id_tenant, created_at DESC NULLS LAST, id DESC;

-- 4. Mostrar quantos registros serão removidos
DO $$
DECLARE
  total_records INTEGER;
  kept_records INTEGER;
  to_delete INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM agent_prompts;
  SELECT COUNT(*) INTO kept_records FROM agent_prompts_to_keep;
  to_delete := total_records - kept_records;
  
  RAISE NOTICE '=== PLANO DE LIMPEZA ===';
  RAISE NOTICE 'Total de registros: %', total_records;
  RAISE NOTICE 'Registros a manter: %', kept_records;
  RAISE NOTICE 'Registros a deletar: %', to_delete;
END $$;

-- 5. BACKUP dos registros que serão deletados (para auditoria)
-- Usar CREATE TABLE AS para copiar schema exato de agent_prompts
DO $$
BEGIN
  -- Dropar tabela de backup se já existir (de execução anterior)
  DROP TABLE IF EXISTS agent_prompts_deleted_backup;
  
  -- Criar tabela com mesmo schema + campo de auditoria
  CREATE TABLE agent_prompts_deleted_backup AS
  SELECT 
    NOW() as backup_date,
    *
  FROM agent_prompts
  WHERE id NOT IN (SELECT id FROM agent_prompts_to_keep);
  
  RAISE NOTICE 'Backup criado: % registros salvos', (SELECT COUNT(*) FROM agent_prompts_deleted_backup);
END $$;

-- 6. Deletar duplicatas (mantendo apenas o mais recente)
DELETE FROM agent_prompts
WHERE id NOT IN (SELECT id FROM agent_prompts_to_keep);

-- 7. Verificação final
DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT id_agent, id_tenant, COUNT(*) as count
    FROM agent_prompts
    GROUP BY id_agent, id_tenant
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
  RAISE NOTICE 'Duplicatas restantes: %', remaining_duplicates;
  
  IF remaining_duplicates > 0 THEN
    RAISE EXCEPTION 'Ainda há duplicatas! Limpeza falhou.';
  ELSE
    RAISE NOTICE '✓ Limpeza concluída com sucesso!';
    RAISE NOTICE '✓ Backup salvo em agent_prompts_deleted_backup';
  END IF;
END $$;

COMMIT;

-- 8. Exibir registros do backup (para auditoria)
-- Os dados deletados estão salvos em: agent_prompts_deleted_backup
SELECT 
  backup_date,
  id_agent,
  id_tenant,
  created_at as original_created_at
FROM agent_prompts_deleted_backup
ORDER BY backup_date DESC
LIMIT 10;
