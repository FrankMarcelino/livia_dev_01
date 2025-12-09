-- Verificar qual é o role do usuário admin@signumcursos.com

SELECT
  id,
  email,
  full_name,
  role,
  tenant_id,
  CASE
    WHEN role = 'super_admin' THEN '🔓 SUPER ADMIN - Vê TODOS os agents (isso é intencional!)'
    WHEN role = 'admin' THEN '🔐 Admin normal - Vê apenas agents do seu tenant'
    WHEN role = 'attendant' THEN '👤 Atendente - Vê apenas agents do seu tenant'
    ELSE '? Role desconhecido'
  END as explicacao
FROM users
WHERE email = 'admin@signumcursos.com';
