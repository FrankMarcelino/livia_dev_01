-- SQL Functions para Quick Replies
-- Execute este SQL no Supabase SQL Editor

-- Função para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_quick_reply_usage(reply_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quick_reply_templates
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION increment_quick_reply_usage(UUID) IS 'Incrementa o contador de uso de uma quick reply';
