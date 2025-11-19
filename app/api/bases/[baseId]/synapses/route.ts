import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSynapsesByBase } from '@/lib/queries/knowledge-base';

/**
 * GET /api/bases/[baseId]/synapses
 *
 * Retorna synapses de uma base de conhecimento específica
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas busca synapses de uma base
 * - Dependency Inversion: Usa query abstraída
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ baseId: string }> }
) {
  try {
    const { baseId } = await params;
    const supabase = await createClient();

    // 1. Validar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscar tenant do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !userData.tenant_id) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    const tenantId = userData.tenant_id;

    // 3. Verificar se a base pertence ao tenant
    const { data: base, error: baseError } = await supabase
      .from('base_conhecimentos')
      .select('id')
      .eq('id', baseId)
      .eq('tenant_id', tenantId)
      .single();

    if (baseError || !base) {
      return NextResponse.json(
        { error: 'Base de conhecimento não encontrada' },
        { status: 404 }
      );
    }

    // 4. Buscar synapses da base
    const synapses = await getSynapsesByBase(baseId, tenantId);

    return NextResponse.json({ synapses });
  } catch (error) {
    console.error('Erro ao buscar synapses:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar synapses' },
      { status: 500 }
    );
  }
}
