/**
 * API Route: Tags CRUD
 * GET - Lista tags do tenant (próprias + herdadas)
 * POST - Cria nova tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTagsForManagement, createTag } from '@/lib/queries/tags-crud';
import { createTagSchema } from '@/lib/validations/tag-validation';

/**
 * GET /api/configuracoes/tags?tenantId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    // Validar que user pertence ao tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const userTenantId = (userData as { tenant_id?: string })?.tenant_id;
    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tags = await getTagsForManagement(tenantId);
    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error('Error in GET /api/configuracoes/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/configuracoes/tags
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createTagSchema.safeParse(body);

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

    const { tenantId, ...payload } = result.data;

    // Validar tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const userTenantId = (userData as { tenant_id?: string })?.tenant_id;
    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tag = await createTag({ ...payload, tenant_id: tenantId });

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    console.error('Error in POST /api/configuracoes/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
