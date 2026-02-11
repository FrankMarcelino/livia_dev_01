-- Adiciona valores faltantes ao enum tenant_reactivation_fallback_action
-- Usado nas configuracoes de reativacao (exhausted_action, max_window_action)
-- Valores esperados: 'end_conversation', 'transfer_to_human', 'do_nothing'
ALTER TYPE tenant_reactivation_fallback_action ADD VALUE IF NOT EXISTS 'transfer_to_human';
ALTER TYPE tenant_reactivation_fallback_action ADD VALUE IF NOT EXISTS 'do_nothing';
