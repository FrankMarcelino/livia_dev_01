-- ============================================================
-- SCRIPT: Copiar dados de Base de Conhecimento e Prompts de Agentes
-- De: Tenant A (31701213-794d-43c3-a74a-50d57fcd9d2b)
-- Para: Tenant B (d23e15bb-5294-4f33-905e-f1565ba6022d)
-- Data: 2026-02-02
-- ============================================================
--
-- TABELAS COPIADAS:
-- 1. base_conhecimentos (com novos UUIDs)
-- 2. base_conhecimentos_vectors (relacionados)
-- 3. agent_prompts
-- 4. agent_prompts_guard_rails
-- 5. agent_prompts_intention
-- 6. agent_prompts_observer
--
-- NOTA: knowledge_domains pertence ao neurocore, nao ao tenant
-- ============================================================

DO $$
DECLARE
  -- IDs dos Tenants
  v_tenant_origem uuid := '31701213-794d-43c3-a74a-50d57fcd9d2b';
  v_tenant_destino uuid := 'd23e15bb-5294-4f33-905e-f1565ba6022d';

  -- Neurocores dos tenants
  v_neurocore_origem uuid;
  v_neurocore_destino uuid;

  -- Contadores
  v_count_bases integer := 0;
  v_count_vectors integer := 0;
  v_count_prompts integer := 0;
  v_count_guard_rails integer := 0;
  v_count_intentions integer := 0;
  v_count_observers integer := 0;

  -- Cursores e records
  r_base RECORD;
  r_vector RECORD;
  r_prompt RECORD;

  -- Mapeamentos de IDs antigos para novos
  v_new_base_id uuid;

BEGIN
  -- ============================================================
  -- 0. VALIDACOES INICIAIS
  -- ============================================================

  -- Verificar se tenant origem existe
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_origem) THEN
    RAISE EXCEPTION 'Tenant de origem nao encontrado: %', v_tenant_origem;
  END IF;

  -- Verificar se tenant destino existe
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_destino) THEN
    RAISE EXCEPTION 'Tenant de destino nao encontrado: %', v_tenant_destino;
  END IF;

  -- Obter neurocores
  SELECT neurocore_id INTO v_neurocore_origem FROM public.tenants WHERE id = v_tenant_origem;
  SELECT neurocore_id INTO v_neurocore_destino FROM public.tenants WHERE id = v_tenant_destino;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'MIGRACAO DE DADOS ENTRE TENANTS';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Tenant Origem: %', v_tenant_origem;
  RAISE NOTICE 'Tenant Destino: %', v_tenant_destino;
  RAISE NOTICE 'Neurocore Origem: %', v_neurocore_origem;
  RAISE NOTICE 'Neurocore Destino: %', v_neurocore_destino;

  IF v_neurocore_origem != v_neurocore_destino THEN
    RAISE NOTICE 'AVISO: Os tenants tem neurocores DIFERENTES!';
    RAISE NOTICE 'A copia de agent_prompts pode nao fazer sentido se os agents forem diferentes.';
  ELSE
    RAISE NOTICE 'OK: Os tenants compartilham o mesmo neurocore.';
  END IF;

  RAISE NOTICE '============================================================';

  -- ============================================================
  -- 1. COPIAR BASE_CONHECIMENTOS
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '1. Copiando BASE_CONHECIMENTOS...';

  -- Criar tabela temporaria para mapear IDs antigos -> novos
  CREATE TEMP TABLE temp_base_mapping (
    old_id uuid PRIMARY KEY,
    new_id uuid NOT NULL
  ) ON COMMIT DROP;

  FOR r_base IN
    SELECT * FROM public.base_conhecimentos
    WHERE tenant_id = v_tenant_origem
  LOOP
    v_new_base_id := gen_random_uuid();

    INSERT INTO public.base_conhecimentos (
      id,
      tenant_id,
      name,
      description,
      neurocore_id,
      is_active,
      created_at,
      updated_at,
      url_attachment,
      domain
      -- base_conhecimentos_vectors sera atualizado depois
    ) VALUES (
      v_new_base_id,
      v_tenant_destino,
      r_base.name,
      r_base.description,
      r_base.neurocore_id, -- Mantém o mesmo neurocore_id
      r_base.is_active,
      now(),
      now(),
      r_base.url_attachment,
      r_base.domain -- Mantém o mesmo domain (pertence ao neurocore)
    );

    -- Guardar mapeamento
    INSERT INTO temp_base_mapping (old_id, new_id) VALUES (r_base.id, v_new_base_id);

    v_count_bases := v_count_bases + 1;
  END LOOP;

  RAISE NOTICE '   Bases copiadas: %', v_count_bases;

  -- ============================================================
  -- 2. COPIAR BASE_CONHECIMENTOS_VECTORS
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '2. Copiando BASE_CONHECIMENTOS_VECTORS...';

  -- Criar tabela temporaria para mapear IDs de vectors
  CREATE TEMP TABLE temp_vector_mapping (
    old_id uuid PRIMARY KEY,
    new_id uuid NOT NULL
  ) ON COMMIT DROP;

  FOR r_vector IN
    SELECT v.*
    FROM public.base_conhecimentos_vectors v
    WHERE v.tenant_id = v_tenant_origem
      OR v.base_conhecimentos_id IN (SELECT old_id FROM temp_base_mapping)
  LOOP
    DECLARE
      v_new_vector_id uuid := gen_random_uuid();
      v_mapped_base_id uuid;
    BEGIN
      -- Buscar o novo ID da base correspondente
      SELECT new_id INTO v_mapped_base_id
      FROM temp_base_mapping
      WHERE old_id = r_vector.base_conhecimentos_id;

      INSERT INTO public.base_conhecimentos_vectors (
        id,
        content,
        metadata,
        embedding,
        base_conhecimentos_id,
        tenant_id
      ) VALUES (
        v_new_vector_id,
        r_vector.content,
        r_vector.metadata,
        r_vector.embedding,
        COALESCE(v_mapped_base_id, r_vector.base_conhecimentos_id),
        v_tenant_destino
      );

      -- Guardar mapeamento
      INSERT INTO temp_vector_mapping (old_id, new_id) VALUES (r_vector.id, v_new_vector_id);

      v_count_vectors := v_count_vectors + 1;
    END;
  END LOOP;

  RAISE NOTICE '   Vectors copiados: %', v_count_vectors;

  -- Atualizar referencia de vectors nas bases copiadas
  UPDATE public.base_conhecimentos bc
  SET base_conhecimentos_vectors = vm.new_id
  FROM temp_base_mapping bm
  JOIN temp_vector_mapping vm ON vm.old_id = (
    SELECT base_conhecimentos_vectors
    FROM public.base_conhecimentos
    WHERE id = bm.old_id
  )
  WHERE bc.id = bm.new_id;

  -- ============================================================
  -- 3. COPIAR AGENT_PROMPTS
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '3. Copiando AGENT_PROMPTS...';

  -- Primeiro, verificar se ja existem prompts para o tenant destino
  -- Se existirem, vamos atualizar ao inves de inserir
  FOR r_prompt IN
    SELECT * FROM public.agent_prompts
    WHERE id_tenant = v_tenant_origem
  LOOP
    -- Verificar se ja existe prompt para este agent no tenant destino
    IF EXISTS (
      SELECT 1 FROM public.agent_prompts
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino
    ) THEN
      -- Atualizar existente
      UPDATE public.agent_prompts SET
        name = r_prompt.name,
        age = r_prompt.age,
        gender = r_prompt.gender,
        objective = r_prompt.objective,
        comunication = r_prompt.comunication,
        personality = r_prompt.personality,
        limitations = r_prompt.limitations,
        rules = r_prompt.rules,
        instructions = r_prompt.instructions,
        guide_line = r_prompt.guide_line,
        others_instructions = r_prompt.others_instructions
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino;
    ELSE
      -- Inserir novo
      INSERT INTO public.agent_prompts (
        created_at,
        name,
        age,
        gender,
        objective,
        comunication,
        personality,
        limitations,
        rules,
        instructions,
        guide_line,
        others_instructions,
        id_agent,
        id_tenant
      ) VALUES (
        now(),
        r_prompt.name,
        r_prompt.age,
        r_prompt.gender,
        r_prompt.objective,
        r_prompt.comunication,
        r_prompt.personality,
        r_prompt.limitations,
        r_prompt.rules,
        r_prompt.instructions,
        r_prompt.guide_line,
        r_prompt.others_instructions,
        r_prompt.id_agent,
        v_tenant_destino
      );
    END IF;

    v_count_prompts := v_count_prompts + 1;
  END LOOP;

  RAISE NOTICE '   Agent Prompts copiados/atualizados: %', v_count_prompts;

  -- ============================================================
  -- 4. COPIAR AGENT_PROMPTS_GUARD_RAILS
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '4. Copiando AGENT_PROMPTS_GUARD_RAILS...';

  FOR r_prompt IN
    SELECT * FROM public.agent_prompts_guard_rails
    WHERE id_tenant = v_tenant_origem
  LOOP
    -- Verificar se ja existe para este agent no tenant destino
    IF EXISTS (
      SELECT 1 FROM public.agent_prompts_guard_rails
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino
    ) THEN
      -- Atualizar existente
      UPDATE public.agent_prompts_guard_rails SET
        prompt_jailbreak = r_prompt.prompt_jailbreak,
        prompt_nsfw = r_prompt.prompt_nsfw
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino;
    ELSE
      -- Inserir novo
      INSERT INTO public.agent_prompts_guard_rails (
        created_at,
        prompt_jailbreak,
        prompt_nsfw,
        id_agent,
        id_tenant
      ) VALUES (
        now(),
        r_prompt.prompt_jailbreak,
        r_prompt.prompt_nsfw,
        r_prompt.id_agent,
        v_tenant_destino
      );
    END IF;

    v_count_guard_rails := v_count_guard_rails + 1;
  END LOOP;

  RAISE NOTICE '   Guard Rails copiados/atualizados: %', v_count_guard_rails;

  -- ============================================================
  -- 5. COPIAR AGENT_PROMPTS_INTENTION
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '5. Copiando AGENT_PROMPTS_INTENTION...';

  FOR r_prompt IN
    SELECT * FROM public.agent_prompts_intention
    WHERE id_tenant = v_tenant_origem
  LOOP
    -- Verificar se ja existe para este agent no tenant destino
    IF EXISTS (
      SELECT 1 FROM public.agent_prompts_intention
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino
    ) THEN
      -- Atualizar existente
      UPDATE public.agent_prompts_intention SET
        prompt = r_prompt.prompt
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino;
    ELSE
      -- Inserir novo
      INSERT INTO public.agent_prompts_intention (
        created_at,
        prompt,
        id_agent,
        id_tenant
      ) VALUES (
        now(),
        r_prompt.prompt,
        r_prompt.id_agent,
        v_tenant_destino
      );
    END IF;

    v_count_intentions := v_count_intentions + 1;
  END LOOP;

  RAISE NOTICE '   Intentions copiadas/atualizadas: %', v_count_intentions;

  -- ============================================================
  -- 6. COPIAR AGENT_PROMPTS_OBSERVER
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '6. Copiando AGENT_PROMPTS_OBSERVER...';

  FOR r_prompt IN
    SELECT * FROM public.agent_prompts_observer
    WHERE id_tenant = v_tenant_origem
  LOOP
    -- Verificar se ja existe para este agent no tenant destino
    IF EXISTS (
      SELECT 1 FROM public.agent_prompts_observer
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino
    ) THEN
      -- Atualizar existente
      UPDATE public.agent_prompts_observer SET
        prompt = r_prompt.prompt
      WHERE id_agent = r_prompt.id_agent AND id_tenant = v_tenant_destino;
    ELSE
      -- Inserir novo
      INSERT INTO public.agent_prompts_observer (
        created_at,
        prompt,
        id_tenant,
        id_agent
      ) VALUES (
        now(),
        r_prompt.prompt,
        v_tenant_destino,
        r_prompt.id_agent
      );
    END IF;

    v_count_observers := v_count_observers + 1;
  END LOOP;

  RAISE NOTICE '   Observers copiados/atualizados: %', v_count_observers;

  -- ============================================================
  -- RESUMO FINAL
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'MIGRACAO CONCLUIDA COM SUCESSO!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'RESUMO:';
  RAISE NOTICE '  - Base Conhecimentos: %', v_count_bases;
  RAISE NOTICE '  - Vectors: %', v_count_vectors;
  RAISE NOTICE '  - Agent Prompts: %', v_count_prompts;
  RAISE NOTICE '  - Guard Rails: %', v_count_guard_rails;
  RAISE NOTICE '  - Intentions: %', v_count_intentions;
  RAISE NOTICE '  - Observers: %', v_count_observers;
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- VERIFICACAO: Consultar dados copiados para o tenant destino
-- ============================================================

-- Base de Conhecimentos do tenant destino
SELECT
  'BASE_CONHECIMENTOS' as tabela,
  count(*) as total
FROM public.base_conhecimentos
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'

UNION ALL

-- Vectors do tenant destino
SELECT
  'BASE_CONHECIMENTOS_VECTORS' as tabela,
  count(*) as total
FROM public.base_conhecimentos_vectors
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'

UNION ALL

-- Agent Prompts do tenant destino
SELECT
  'AGENT_PROMPTS' as tabela,
  count(*) as total
FROM public.agent_prompts
WHERE id_tenant = 'd23e15bb-5294-4f33-905e-f1565ba6022d'

UNION ALL

-- Guard Rails do tenant destino
SELECT
  'GUARD_RAILS' as tabela,
  count(*) as total
FROM public.agent_prompts_guard_rails
WHERE id_tenant = 'd23e15bb-5294-4f33-905e-f1565ba6022d'

UNION ALL

-- Intentions do tenant destino
SELECT
  'INTENTIONS' as tabela,
  count(*) as total
FROM public.agent_prompts_intention
WHERE id_tenant = 'd23e15bb-5294-4f33-905e-f1565ba6022d'

UNION ALL

-- Observers do tenant destino
SELECT
  'OBSERVERS' as tabela,
  count(*) as total
FROM public.agent_prompts_observer
WHERE id_tenant = 'd23e15bb-5294-4f33-905e-f1565ba6022d';
