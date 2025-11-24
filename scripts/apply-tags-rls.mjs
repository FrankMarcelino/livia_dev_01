import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wfrxwfbslhkkzkexyilx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0'
);

console.log('🔐 Aplicando RLS policies na tabela tags...\n');

// 1. Habilitar RLS
console.log('1. Habilitando RLS...');
await supabase.rpc('exec', {
  query: 'ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;'
}).catch(() => {});

// 2. Criar policy de SELECT
console.log('2. Criando policy SELECT...');
const selectPolicy = `
DROP POLICY IF EXISTS "Users can view tags from their tenant" ON public.tags;
CREATE POLICY "Users can view tags from their tenant"
ON public.tags
FOR SELECT
TO public
USING (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);
`;

await supabase.rpc('exec', { query: selectPolicy }).catch(() => {});

console.log('\n✅ RLS configurado!');
console.log('\n📝 Se não funcionou, execute manualmente:');
console.log('   https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new\n');
console.log(selectPolicy);
