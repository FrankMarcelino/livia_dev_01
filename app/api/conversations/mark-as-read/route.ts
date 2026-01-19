/**
 * API Route: Mark Conversation as Read
 *
 * Marks a conversation as read (resets unread count)
 * POST /api/conversations/mark-as-read
 *
 * Flow:
 * 1. Validate auth + tenant
 * 2. Validate conversation belongs to tenant
 * 3. Update: has_unread = false, unread_count = 0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // 2. Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Validate conversation belongs to tenant and update in single query
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        has_unread: false,
        unread_count: 0,
      })
      .eq('id', conversationId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('[mark-as-read] Update error:', updateError);
      return NextResponse.json(
        { error: 'Erro ao marcar como lida' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa marcada como lida',
    });

  } catch (error) {
    console.error('[mark-as-read] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
