-- ====================================================================
-- TESTE: Inserir novo agent_prompt manualmente
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================
--
-- Este script testa se você consegue criar um novo agent_prompt
-- diretamente no banco, ajudando a identificar se o problema é:
-- - RLS policy bloqueando
-- - Schema/validação
-- - Problema na aplicação

-- ⚠️ ANTES DE EXECUTAR: Substitua os valores entre <SUBSTITUIR>

-- 1. Ver seu user_id e tenant_id atual
SELECT 
  auth.uid() as my_user_id,
  u.tenant_id as my_tenant_id,
  t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.id = auth.uid();

-- 2. Ver agents disponíveis para seu tenant
SELECT 
  a.id as agent_id,
  a.name as agent_name,
  a.type,
  t.neurocore_id
FROM agents a
JOIN tenants t ON t.neurocore_id = a.id_neurocore
JOIN users u ON u.tenant_id = t.id
WHERE u.id = auth.uid()
LIMIT 5;

-- 3. Verificar se já existe prompt para um agent específico
-- ⚠️ Substitua <AGENT_ID> com um ID da query acima
SELECT *
FROM agent_prompts
WHERE id_agent = '<AGENT_ID>'
  AND id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid());

-- 4. TESTE DE INSERT - Tentar criar novo prompt
-- ⚠️ Substitua <AGENT_ID> com um ID de agent que NÃO tem prompt ainda
INSERT INTO agent_prompts (
  id_agent,
  id_tenant,
  limitations,
  instructions,
  rules,
  guide_line,
  others_instructions,
  name,
  age,
  gender,
  objective,
  comunication,
  personality
) VALUES (
  '<AGENT_ID>',  -- ⚠️ SUBSTITUIR
  (SELECT tenant_id FROM users WHERE id = auth.uid()),
  '[{"title":"Teste Limitação","type":"markdown","active":true,"sub":[]}]'::jsonb,
  '[{"title":"Teste Instrução","type":"markdown","active":true,"sub":[]}]'::jsonb,
  '[{"title":"Teste Regra","type":"markdown","active":true,"sub":[]}]'::jsonb,
  '[{"title":"Teste Guideline","type":"markdown","active":true,"sub":[]}]'::jsonb,
  '[{"title":"Teste Outras","type":"markdown","active":true,"sub":[]}]'::jsonb,
  'Agent Teste',
  '25',
  'neutral',
  'Objetivo de teste',
  'Comunicação teste',
  'Personalidade teste'
)
RETURNING *;

-- 5. TESTE DE UPDATE - Tentar atualizar prompt existente
-- ⚠️ Substitua <AGENT_ID> com um ID de agent que JÁ tem prompt
UPDATE agent_prompts
SET 
  limitations = '[{"title":"Limitação Atualizada","type":"markdown","active":true,"sub":[]}]'::jsonb,
  updated_at = NOW()
WHERE id_agent = '<AGENT_ID>'
  AND id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid())
RETURNING *;

-- ====================================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ====================================================================
--
-- ✅ INSERT funcionou:
--    - RLS policies estão OK
--    - Problema está na APLICAÇÃO (frontend/backend)
--
-- ❌ INSERT falhou com erro de permissão:
--    - RLS policy faltando ou incorreta
--    - Executar migration 010
--
-- ❌ INSERT falhou com erro de schema:
--    - Estrutura JSONB incorreta
--    - Verificar tipos no banco vs código
--
