-- ============================================
-- DADOS DE EXEMPLO - Quick Replies
-- Executar no Supabase SQL Editor
-- ============================================

-- Tenant: Empresa Demo
-- ID: d23e15bb-5294-4f33-905e-f1565ba6022d

-- Respostas Rápidas de Exemplo
INSERT INTO quick_reply_templates (tenant_id, title, message, icon, usage_count) VALUES
-- Saudações
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Boas-vindas', 'Olá {nome_cliente}! Bem-vindo(a) à nossa empresa. Como posso ajudá-lo(a) hoje?', '👋', 0),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Bom dia', 'Bom dia, {nome_cliente}! Como posso auxiliá-lo(a) hoje?', '☀️', 0),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Boa tarde', 'Boa tarde! Em que posso ajudá-lo(a), {nome_cliente}?', '🌤️', 0),

-- Informações
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Protocolo', 'Seu número de protocolo é: {protocolo}. Guarde para futuras consultas.', '📋', 5),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Horário de Atendimento', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', '🕐', 3),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Aguarde', 'Por favor, aguarde um momento enquilo verifico as informações para você.', '⏳', 8),

-- Despedidas
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Até logo', 'Foi um prazer atendê-lo(a), {nome_cliente}! Até logo!', '👋', 2),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Encerramento', 'Atendimento finalizado em {data} às {hora}. Protocolo: {protocolo}', '✅', 10),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Volte sempre', 'Obrigado por entrar em contato! Volte sempre que precisar.', '💚', 1),

-- Solicitações comuns
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Solicitar dados', 'Preciso de alguns dados para prosseguir. Pode me informar seu CPF e email?', '📝', 4),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Confirmar dados', 'Vou confirmar seus dados: Nome: {nome_cliente}. Está correto?', '✓', 6),
('d23e15bb-5294-4f33-905e-f1565ba6022d', 'Transferir para humano', 'Vou transferir você para um atendente humano. Aguarde um momento.', '👤', 7)

ON CONFLICT DO NOTHING;

-- Verificar dados inseridos
SELECT id, title, icon, usage_count FROM quick_reply_templates
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
ORDER BY usage_count DESC;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
