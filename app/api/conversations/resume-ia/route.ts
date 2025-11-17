/**
 * API Route: Resume IA
 *
 * Retoma IA em uma conversa específica
 * POST /api/conversations/resume-ia
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar payload
    const body = await request.json();
    const { conversationId, tenantId } = body;

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Validar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if ((userData as any)?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Buscar conversa e validar estado
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, tenant_id, ia_active')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = conversation as any;
    if (conv.ia_active) {
      return NextResponse.json({ error: 'IA já está ativa' }, { status: 400 });
    }

    // 5. Retomar IA
    const updateData: any = {
      ia_active: true,
      ia_paused_by_user_id: null,
      ia_paused_at: null,
      ia_pause_reason: null,
    };

    const { error: updateError} = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'IA retomada com sucesso',
    });

  } catch (error) {
    console.error('Error in resume-ia:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
