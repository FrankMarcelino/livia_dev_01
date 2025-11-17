-- Script para corrigir políticas RLS da tabela users
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 2. Criar políticas simples e diretas

-- Permitir que usuários autenticados leiam seus próprios dados
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Permitir que usuários autenticados atualizem seus próprios dados
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- NOTA: Removemos a política de super_admin por enquanto para evitar recursão
-- No futuro, podemos usar uma tabela separada para roles ou usar auth.jwt()

-- NOTA: Para criar novos usuários, usamos Service Role Key (bypass RLS)
-- Não criamos política de INSERT porque usuários são criados via backend

-- 3. Verificar se RLS está ativado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Testar (execute após aplicar as políticas):
-- SELECT * FROM users WHERE id = auth.uid(); -- Deve funcionar
