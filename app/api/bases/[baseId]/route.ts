import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ baseId: string }> }
) {
  try {
    const supabase = await createClient();
    const { baseId } = await params;

    const { data, error } = await supabase
      .from('base_conhecimentos')
      .select(`
        id,
        name,
        description,
        domain,
        is_active,
        tenant_id,
        neurocore_id
      `)
      .eq('id', baseId)
      .single();

    if (error) {
      console.error('Error fetching base:', error);
      return NextResponse.json(
        { error: 'Base de conhecimento não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/bases/[baseId]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
