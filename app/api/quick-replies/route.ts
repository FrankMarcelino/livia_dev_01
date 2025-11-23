/**
 * API Route: Quick Replies
 *
 * GET - Lista quick replies do tenant
 * POST - Cria nova quick reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuickReplies, createQuickReply } from '@/lib/queries/quick-replies';
import { z } from 'zod';

// Schema de validação para criação
const createQuickReplySchema = z.object({
  emoji: z.string().optional().nullable(),
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(1000, 'Conteúdo muito longo'),
  tenantId: z.string().uuid(),
});

/**
 * GET /api/quick-replies
 * Lista quick replies do tenant
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Buscar tenantId do query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Validar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const userTenantId = (userData as { tenant_id?: string })?.tenant_id;

    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Buscar quick replies
    const quickReplies = await getQuickReplies(tenantId);

    return NextResponse.json({ data: quickReplies });

  } catch (error) {
    console.error('Error in GET /api/quick-replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quick-replies
 * Cria nova quick reply
 */
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
    const result = createQuickReplySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { tenantId, ...payload } = result.data;

    // 3. Validar tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const userTenantId = (userData as { tenant_id?: string })?.tenant_id;

    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Criar quick reply (nasce ativa com usage_count = 0)
    const quickReply = await createQuickReply({ ...payload, tenantId }, user.id);

    return NextResponse.json({
      success: true,
      data: quickReply,
    });

  } catch (error) {
    console.error('Error in POST /api/quick-replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
