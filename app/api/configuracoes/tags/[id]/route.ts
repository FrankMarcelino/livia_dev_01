/**
 * API Route: Tag [id]
 * PATCH - Atualiza tag (só se pertence ao tenant)
 * DELETE - Deleta tag (só se pertence ao tenant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTagById, updateTag, deleteTag } from '@/lib/queries/tags-crud';
import { updateTagSchema } from '@/lib/validations/tag-validation';

/**
 * PATCH /api/configuracoes/tags/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    // Verificar se tag existe e pertence ao tenant
    const existing = await getTagById(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }

    // Validar payload
    const body = await request.json();
    const result = updateTagSchema.safeParse(body);

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

    const updated = await updateTag(id, tenantId, result.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /api/configuracoes/tags/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/configuracoes/tags/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    // Verificar se tag existe e pertence ao tenant
    const existing = await getTagById(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }

    await deleteTag(id, tenantId);
    return NextResponse.json({ success: true, message: 'Tag deletada com sucesso' });
  } catch (error) {
    console.error('[DELETE /api/configuracoes/tags/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
