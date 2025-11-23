/**
 * API Route: Quick Reply Usage
 *
 * POST - Incrementa contador de uso de uma quick reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { incrementQuickReplyUsage } from '@/lib/queries/quick-replies';
import { z } from 'zod';

const usageSchema = z.object({
  quickReplyId: z.string().uuid('ID inválido'),
  tenantId: z.string().uuid('tenantID inválido'),
});

/**
 * POST /api/quick-replies/usage
 * Incrementa contador de uso
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
    const result = usageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { quickReplyId, tenantId } = result.data;

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

    // 4. Incrementar uso
    await incrementQuickReplyUsage(quickReplyId, tenantId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in POST /api/quick-replies/usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
