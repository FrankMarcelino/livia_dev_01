/**
 * API Route: Quick Reply [id]
 * PATCH /api/quick-replies/[id] - Atualiza quick reply
 * DELETE /api/quick-replies/[id] - Deleta quick reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getQuickReplyById,
  updateQuickReply,
  deleteQuickReply,
} from '@/lib/queries/quick-replies';
import { z } from 'zod';

// Schema de validação para atualização
const updateQuickReplySchema = z.object({
  emoji: z.string().optional().nullable(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  active: z.boolean().optional(),
});

/**
 * PATCH /api/quick-replies/[id]
 * Atualiza uma quick reply
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Verificar se quick reply existe e pertence ao tenant
    const existing = await getQuickReplyById(id, tenantId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Quick reply not found' },
        { status: 404 }
      );
    }

    // Validar payload
    const body = await request.json();
    const result = updateQuickReplySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Atualizar quick reply
    const updated = await updateQuickReply(id, tenantId, result.data);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[PATCH /api/quick-replies/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quick-replies/[id]
 * Deleta uma quick reply
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantId = userData.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // Verificar se quick reply existe e pertence ao tenant
    const existing = await getQuickReplyById(id, tenantId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Quick reply not found' },
        { status: 404 }
      );
    }

    // Deletar quick reply
    await deleteQuickReply(id, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Quick reply deletada com sucesso',
    });
  } catch (error) {
    console.error('[DELETE /api/quick-replies/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
