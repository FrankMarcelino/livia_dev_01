/**
 * API Route: Resume IA
 *
 * Retoma IA em uma conversa específica
 * POST /api/conversations/resume-ia
 *
 * Fluxo:
 * 1. Validar auth + tenant
 * 2. Chamar n8n webhook para processar
 * 3. N8N faz UPDATE em conversations (ia_active=true, pause_notes=null)
 * 4. Se n8n falhar, fazer UPDATE direto como fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callN8nWebhook } from '@/lib/n8n/client';

const N8N_RESUME_IA_WEBHOOK = process.env.N8N_RESUME_IA_WEBHOOK!;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse payload
    const body = await request.json();
    const { conversationId, tenantId } = body;

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // 2. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Buscar conversa e validar (query única otimizada)
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, tenant_id, ia_active, status')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !conversation) {
      console.error('[resume-ia] Conversation not found:', fetchError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = conversation as any;
    if (conv.ia_active) {
      return NextResponse.json({ error: 'IA já está ativa' }, { status: 400 });
    }

    const dbTime = Date.now() - startTime;
    console.error(`[resume-ia] ✅ Validation took ${dbTime}ms (conversation: ${conversationId.slice(0, 8)})`);

    // 4. Chamar N8N webhook (AWAIT para garantir execução em Vercel)
    console.error(`[resume-ia] 🚀 Calling n8n webhook...`);

    const result = await callN8nWebhook(
      N8N_RESUME_IA_WEBHOOK,
      {
        conversationId,
        tenantId,
        userId: user.id,
      },
      { timeout: 5000 } // 5 segundos timeout
    );

    const n8nTime = Date.now() - startTime - dbTime;

    if (result.success) {
      console.error(`[resume-ia] ✅ N8N responded successfully in ${n8nTime}ms`);

      // N8N já fez:
      // - UPDATE conversations SET ia_active=true, pause_notes=null

      const totalTime = Date.now() - startTime;
      console.error(`[resume-ia] ⏱️ Total time: ${totalTime}ms`);

      return NextResponse.json({
        success: true,
        message: 'IA retomada com sucesso',
      });
    } else {
      console.error(`[resume-ia] ⚠️ N8N failed after ${n8nTime}ms:`, result.error);

      // Fallback: Fazer UPDATE direto no banco usando apenas colunas existentes
      console.error(`[resume-ia] 🔄 Using fallback: direct database update`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ia_active: true,
        pause_notes: null,
      };

      const { error: updateError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);

      if (updateError) {
        throw updateError;
      }

      const totalTime = Date.now() - startTime;
      console.error(`[resume-ia] ⚠️ Fallback succeeded in ${totalTime}ms`);

      return NextResponse.json({
        success: true,
        message: 'IA retomada com sucesso (fallback)',
      });
    }

  } catch (error) {
    console.error('[resume-ia] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
