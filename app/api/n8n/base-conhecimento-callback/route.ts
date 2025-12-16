/**
 * API Route: Base Conhecimento Callback
 *
 * POST /api/n8n/base-conhecimento-callback
 *
 * Chamado pelo N8N quando a vetorização de uma base de conhecimento é concluída.
 *
 * Fluxo:
 * 1. N8N processa description da base
 * 2. N8N cria embeddings e salva em base_conhecimentos_vectors
 * 3. N8N chama este endpoint com id_base_conhecimento_geral + vector_id
 * 4. Este endpoint atualiza base_conhecimentos:
 *    - base_conhecimentos_vectors = vector_id
 *    - is_active = true
 *
 * Payload esperado:
 * {
 *   "id_base_conhecimento_geral": "uuid",
 *   "vector_id": "uuid"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBaseAfterVectorization } from '@/lib/queries/knowledge-base';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação do payload
    const body = await request.json();
    const { id_base_conhecimento_geral, vector_id } = body;

    if (!id_base_conhecimento_geral || !vector_id) {
      console.error('[base-callback] Missing required fields:', body);
      return NextResponse.json(
        { error: 'id_base_conhecimento_geral e vector_id são obrigatórios' },
        { status: 400 }
      );
    }

    console.warn('[base-callback] Recebendo callback do N8N:', {
      base_id: id_base_conhecimento_geral,
      vector_id,
    });

    // 2. Atualizar base de conhecimento
    const base = await updateBaseAfterVectorization(
      id_base_conhecimento_geral,
      vector_id
    );

    console.warn('[base-callback] ✅ Base atualizada com sucesso:', {
      base_id: base.id,
      is_active: base.is_active,
      has_vector: !!base.base_conhecimentos_vectors,
    });

    // 3. Retornar sucesso
    return NextResponse.json({
      success: true,
      base: {
        id: base.id,
        is_active: base.is_active,
        base_conhecimentos_vectors: base.base_conhecimentos_vectors,
      },
    });
  } catch (error) {
    console.error('[base-callback] Erro ao processar callback:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar base de conhecimento',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
