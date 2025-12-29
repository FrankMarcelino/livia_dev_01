-- Migration: Fix tag_type for existing tags
-- Description: Define tag_type para tags existentes que estão com NULL
-- Date: 2025-12-29

-- Atualizar tags com is_category=true para ter tag_type='description'
-- Essas são as categorias do Livechat (Presencial, Teoria, etc) que devem aparecer como tags de intenção
UPDATE tags
SET tag_type = 'description'
WHERE tag_type IS NULL
  AND is_category = true;

-- Atualizar demais tags (is_category=false ou NULL) para ter tag_type='description' por padrão
UPDATE tags
SET tag_type = 'description'
WHERE tag_type IS NULL
  AND (is_category = false OR is_category IS NULL);

-- Verificar resultado
SELECT
  id,
  tag_name,
  tag_type,
  is_category,
  id_tenant
FROM tags
ORDER BY tag_type, order_index;
