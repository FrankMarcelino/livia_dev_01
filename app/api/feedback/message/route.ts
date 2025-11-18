/**
 * API Route: Message Feedback
 *
 * POST - Cria ou atualiza feedback de uma mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertMessageFeedback } from '@/lib/queries/feedback';
import { z } from 'zod';

// Schema de validação
const feedbackSchema = z.object({
  messageId: z.string().uuid('messageId inválido'),
  conversationId: z.string().uuid('conversationId inválido'),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(500, 'Comentário muito longo').optional(),
  tenantId: z.string().uuid('tenantId inválido'),
});

/**
 * POST /api/feedback/message
 * Cria ou atualiza feedback de uma mensagem
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
    const result = feedbackSchema.safeParse(body);

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

    // 4. Criar/atualizar feedback
    const feedback = await upsertMessageFeedback(
      { ...payload, tenantId },
      user.id
    );

    if (!feedback) {
      return NextResponse.json(
        { error: 'Erro ao salvar feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback,
    });

  } catch (error) {
    console.error('Error in POST /api/feedback/message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
