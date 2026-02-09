-- ============================================
-- Script para verificar registros órfãos em conversation_tags
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- DIAGNÓSTICO PRINCIPAL: Tags retornando NULL
-- ============================================

-- 0. Verificar conversation_tags onde a tag está INATIVA (active=false)
-- ESTA É A CAUSA MAIS PROVÁVEL DO ERRO!
SELECT
    ct.id as conversation_tag_id,
    ct.conversation_id,
    ct.tag_id,
    t.tag_name,
    t.active as tag_active,
    t.id_neurocore
FROM conversation_tags ct
JOIN tags t ON ct.tag_id = t.id
WHERE t.active = false;

-- 0b. Contar quantas conversation_tags apontam para tags inativas
SELECT COUNT(*) as total_inactive_tag_references
FROM conversation_tags ct
JOIN tags t ON ct.tag_id = t.id
WHERE t.active = false;

-- 0c. Verificar conversation_tags onde a conversa e a tag pertencem a neurocores diferentes
-- (isso pode causar null no JOIN se houver filtro de neurocore)
SELECT
    ct.id as conversation_tag_id,
    ct.conversation_id,
    ct.tag_id,
    c.tenant_id,
    t.tag_name,
    t.id_neurocore as tag_neurocore,
    n.tenant_id as neurocore_tenant
FROM conversation_tags ct
JOIN conversations c ON ct.conversation_id = c.id
JOIN tags t ON ct.tag_id = t.id
LEFT JOIN neurocores n ON t.id_neurocore = n.id
WHERE c.tenant_id != n.tenant_id OR n.tenant_id IS NULL;

-- 0d. SIMULAÇÃO DO PROBLEMA: Mostrar todos os conversation_tags com detalhes da tag
-- Se tag_name for NULL, este é o registro problemático
SELECT
    ct.id as conversation_tag_id,
    ct.conversation_id,
    ct.tag_id,
    t.id as tag_exists,
    t.tag_name,
    t.active as tag_active,
    CASE
        WHEN t.id IS NULL THEN 'TAG_DELETADA'
        WHEN t.active = false THEN 'TAG_INATIVA'
        ELSE 'OK'
    END as status
FROM conversation_tags ct
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE t.id IS NULL OR t.active = false
ORDER BY ct.created_at DESC;

-- ============================================
-- DIAGNÓSTICO SECUNDÁRIO: Órfãos
-- ============================================

-- 1. Verificar registros em conversation_tags que apontam para tags inexistentes
SELECT
    ct.id as conversation_tag_id,
    ct.conversation_id,
    ct.tag_id,
    ct.created_at,
    c.contact_id,
    c.status as conversation_status
FROM conversation_tags ct
LEFT JOIN tags t ON ct.tag_id = t.id
LEFT JOIN conversations c ON ct.conversation_id = c.id
WHERE t.id IS NULL;

-- 2. Contar quantos registros órfãos existem
SELECT COUNT(*) as total_orphan_records
FROM conversation_tags ct
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE t.id IS NULL;

-- 3. Verificar também conversation_tags apontando para conversas inexistentes
SELECT
    ct.id as conversation_tag_id,
    ct.conversation_id,
    ct.tag_id
FROM conversation_tags ct
LEFT JOIN conversations c ON ct.conversation_id = c.id
WHERE c.id IS NULL;

-- 4. Listar todas as tags ativas para referência
SELECT id, tag_name, tag_type, tenant_id, created_at
FROM tags
ORDER BY tenant_id, tag_type, tag_name;

-- ============================================
-- SCRIPTS DE LIMPEZA (executar apenas se necessário)
-- ============================================

-- 5. DELETAR registros que apontam para tags INATIVAS
-- ⚠️ CUIDADO: Execute apenas após verificar os resultados acima
-- DELETE FROM conversation_tags
-- WHERE tag_id IN (SELECT id FROM tags WHERE active = false);

-- 6. DELETAR registros órfãos (tags inexistentes)
-- ⚠️ CUIDADO: Execute apenas após verificar os resultados acima
-- DELETE FROM conversation_tags
-- WHERE tag_id NOT IN (SELECT id FROM tags);

-- 7. DELETAR registros órfãos (conversas inexistentes)
-- ⚠️ CUIDADO: Execute apenas após verificar os resultados acima
-- DELETE FROM conversation_tags
-- WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- ============================================
-- PREVENÇÃO: Adicionar constraints (se não existirem)
-- ============================================

-- 8. Verificar constraints existentes na tabela
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'conversation_tags';

-- 9. Adicionar ON DELETE CASCADE para tag_id (se necessário)
-- ⚠️ Primeiro, verifique o nome da constraint existente com a query 8
-- ALTER TABLE conversation_tags
-- DROP CONSTRAINT IF EXISTS conversation_tags_tag_id_fkey;
--
-- ALTER TABLE conversation_tags
-- ADD CONSTRAINT conversation_tags_tag_id_fkey
-- FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

-- 10. Adicionar ON DELETE CASCADE para conversation_id (se necessário)
-- ⚠️ Primeiro, verifique o nome da constraint existente com a query 8
-- ALTER TABLE conversation_tags
-- DROP CONSTRAINT IF EXISTS conversation_tags_conversation_id_fkey;
--
-- ALTER TABLE conversation_tags
-- ADD CONSTRAINT conversation_tags_conversation_id_fkey
-- FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
