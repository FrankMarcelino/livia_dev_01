-- ====================================================================
-- INSPEÇÃO: Categorização de Agentes
-- ====================================================================

-- 1. Ver enum de funções
SELECT typname, enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'agent_function_enum';

-- 2. Ver enum de tipos
SELECT typname, enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'agent_type_enum';

-- 3. Ver exemplos de agents e suas funções
SELECT 
  id, 
  name, 
  function, 
  type, 
  is_intent_agent,
  -- Verificar se tem prompt em cada tabela
  (SELECT COUNT(*) FROM agent_prompts WHERE id_agent = agents.id) as has_main_prompt,
  (SELECT COUNT(*) FROM agent_prompts_intention WHERE id_agent = agents.id) as has_intention_prompt,
  (SELECT COUNT(*) FROM agent_prompts_observer WHERE id_agent = agents.id) as has_observer_prompt,
  (SELECT COUNT(*) FROM agent_prompts_guard_rails WHERE id_agent = agents.id) as has_guard_rails_prompt
FROM agents
LIMIT 20;
