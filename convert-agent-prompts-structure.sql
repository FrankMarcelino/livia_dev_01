-- Script: Converter estrutura JSONB dos dados existentes em agent_prompts
-- Execute DEPOIS da migration 011_fix_agent_prompts_jsonb_structure.sql
--
-- Este script converte os campos que têm estrutura GuidelineStep[]
-- para arrays simples de strings, extraindo o campo "title" de cada objeto

-- Backup antes de executar (recomendado)
-- CREATE TABLE agent_prompts_backup_before_conversion AS SELECT * FROM agent_prompts;

-- Função helper para extrair títulos de estruturas complexas
CREATE OR REPLACE FUNCTION extract_titles_from_complex(field jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se for null ou não for array, retornar array vazio
  IF field IS NULL OR jsonb_typeof(field) != 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Se o primeiro elemento não tem 'title', já é array simples - retornar como está
  IF jsonb_array_length(field) > 0 AND NOT (field->0 ? 'title') THEN
    RETURN field;
  END IF;

  -- Extrair os títulos de objetos complexos
  RETURN (
    SELECT jsonb_agg(item->>'title')
    FROM jsonb_array_elements(field) AS item
    WHERE item ? 'title'
  );
END;
$$;

-- Converter limitations
UPDATE agent_prompts
SET limitations = extract_titles_from_complex(limitations)
WHERE limitations IS NOT NULL
  AND jsonb_typeof(limitations) = 'array'
  AND jsonb_array_length(limitations) > 0
  AND (limitations->0 ? 'title');

-- Converter instructions
UPDATE agent_prompts
SET instructions = extract_titles_from_complex(instructions)
WHERE instructions IS NOT NULL
  AND jsonb_typeof(instructions) = 'array'
  AND jsonb_array_length(instructions) > 0
  AND (instructions->0 ? 'title');

-- Converter rules
UPDATE agent_prompts
SET rules = extract_titles_from_complex(rules)
WHERE rules IS NOT NULL
  AND jsonb_typeof(rules) = 'array'
  AND jsonb_array_length(rules) > 0
  AND (rules->0 ? 'title');

-- Converter others_instructions
UPDATE agent_prompts
SET others_instructions = extract_titles_from_complex(others_instructions)
WHERE others_instructions IS NOT NULL
  AND jsonb_typeof(others_instructions) = 'array'
  AND jsonb_array_length(others_instructions) > 0
  AND (others_instructions->0 ? 'title');

-- Verificar resultados
SELECT
  id,
  id_tenant,
  name,
  CASE
    WHEN limitations IS NOT NULL THEN jsonb_array_length(limitations)
    ELSE 0
  END as limitations_count,
  CASE
    WHEN instructions IS NOT NULL THEN jsonb_array_length(instructions)
    ELSE 0
  END as instructions_count,
  CASE
    WHEN rules IS NOT NULL THEN jsonb_array_length(rules)
    ELSE 0
  END as rules_count,
  CASE
    WHEN others_instructions IS NOT NULL THEN jsonb_array_length(others_instructions)
    ELSE 0
  END as others_instructions_count
FROM agent_prompts
ORDER BY name, id_tenant NULLS FIRST;

-- Limpar função temporária
DROP FUNCTION IF EXISTS extract_titles_from_complex(jsonb);

-- Resultado esperado:
-- Todos os campos devem ter arrays simples de strings
-- Exemplo: limitations = ["Limitação 1", "Limitação 2"]
