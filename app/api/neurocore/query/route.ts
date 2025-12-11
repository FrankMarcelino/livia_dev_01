import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  NeurocoreQueryRequest,
  NeurocoreQueryResponse,
  MockTrainingResponse,
} from '@/types/neurocore';

// Configuração
const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_NEUROCORE_QUERY_WEBHOOK = process.env.N8N_NEUROCORE_QUERY_WEBHOOK;
const NEUROCORE_MOCK = process.env.NEUROCORE_MOCK === 'true';

// Timeout para chamada n8n (30 segundos)
const N8N_TIMEOUT = 30000;

/**
 * POST /api/neurocore/query
 *
 * Envia uma pergunta para o n8n processar:
 * 1. n8n gera embedding da pergunta
 * 2. Busca synapses similares (vector search)
 * 3. Monta contexto
 * 4. Chama LLM (GPT-4)
 * 5. Retorna resposta + synapses usadas
 *
 * Modo mock (NEUROCORE_MOCK=true):
 * - Retorna resposta fake para desenvolvimento
 * - Não chama n8n
 * - Simula latência de 2-3 segundos
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<NeurocoreQueryResponse>(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Validar payload
    const body = (await request.json()) as NeurocoreQueryRequest;
    const { question, tenantId } = body;

    if (!question || question.trim().length < 3) {
      return NextResponse.json<NeurocoreQueryResponse>(
        { success: false, error: 'Pergunta muito curta (mínimo 3 caracteres)' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json<NeurocoreQueryResponse>(
        { success: false, error: 'tenantId obrigatório' },
        { status: 400 }
      );
    }

    // 3. Validar tenant do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json<NeurocoreQueryResponse>(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (userData.tenant_id !== tenantId) {
      return NextResponse.json<NeurocoreQueryResponse>(
        { success: false, error: 'Acesso negado ao tenant' },
        { status: 403 }
      );
    }

    // 4. Modo MOCK - Desenvolvimento sem n8n
    if (NEUROCORE_MOCK) {
      const mockResponse = await generateMockResponse(question);
      return NextResponse.json<NeurocoreQueryResponse>({
        success: true,
        data: mockResponse,
      });
    }

    // 5. Modo REAL - Chamar webhook n8n
    if (!N8N_BASE_URL || !N8N_NEUROCORE_QUERY_WEBHOOK) {
      return NextResponse.json<NeurocoreQueryResponse>(
        {
          success: false,
          error: 'Configuração de n8n ausente (N8N_BASE_URL ou webhook)',
        },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT);

    try {
      // Montar URL do webhook usando variáveis de ambiente
      const webhookUrl = `${N8N_BASE_URL}${N8N_NEUROCORE_QUERY_WEBHOOK}`;
      
      console.log('[neurocore] 📤 Enviando query para n8n:', {
        url: webhookUrl,
        tenantId,
        question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      });
      
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tenant: tenantId,
          Question: question,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[neurocore] 📥 Resposta do n8n recebida:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        contentType: n8nResponse.headers.get('content-type'),
      });

      if (!n8nResponse.ok) {
        // Tentar capturar detalhes do erro do n8n
        let errorDetails = '';
        try {
          const errorBody = await n8nResponse.text();
          errorDetails = errorBody;
          console.error('[neurocore] ❌ Erro do n8n:', {
            status: n8nResponse.status,
            statusText: n8nResponse.statusText,
            body: errorBody,
          });
        } catch (_e) {
          console.error('[neurocore] ❌ Não foi possível ler corpo do erro');
        }
        
        throw new Error(
          `n8n retornou status ${n8nResponse.status}${errorDetails ? `: ${errorDetails}` : ''}`
        );
      }

      // Capturar o texto da resposta primeiro para debug
      const responseText = await n8nResponse.text();
      console.log('[neurocore] 📄 Corpo da resposta:', responseText.substring(0, 500));

      // Validar se há conteúdo
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('n8n retornou resposta vazia');
      }

      // Tentar fazer parse do JSON
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (error) {
        console.error('[neurocore] ❌ Erro ao fazer parse do JSON:', error);
        throw new Error(`Resposta do n8n não é um JSON válido: ${responseText.substring(0, 200)}`);
      }

      // Extrair campo 'return' da resposta do n8n
      const data = parsedData.return || parsedData;

      // Validar estrutura da resposta
      if (!data.answer) {
        console.error('[neurocore] ❌ Estrutura inválida:', parsedData);
        throw new Error('Resposta do n8n não contém campo "answer"');
      }

      const processingTime = Date.now() - startTime;

      console.log('[neurocore] ✅ Resposta processada com sucesso:', {
        processingTime,
        hasSynapses: !!data.synapsesUsed,
        synapsesCount: data.synapsesUsed?.length || 0,
      });

      return NextResponse.json<NeurocoreQueryResponse>({
        success: true,
        data: {
          answer: data.answer,
          synapsesUsed: data.synapsesUsed || [],
          processingTime,
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        return NextResponse.json<NeurocoreQueryResponse>(
          {
            success: false,
            error: 'Timeout: n8n demorou mais de 30 segundos para responder',
          },
          { status: 504 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Erro ao processar query do Neurocore:', error);
    return NextResponse.json<NeurocoreQueryResponse>(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Gera resposta mock para desenvolvimento
 * Simula latência de 2-3 segundos
 */
async function generateMockResponse(
  _question: string // Prefixado com _ para indicar que não é usado no mock
): Promise<MockTrainingResponse> {
  // Simular latência do n8n (2-3 segundos)
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Resposta mock baseada na pergunta
  const mockAnswer = `
O prazo para devolução de produtos é de **7 dias corridos** a partir do recebimento.
Para produtos eletrônicos, o prazo é de **15 dias corridos**.

Produtos com defeito têm **30 dias** de garantia a partir do recebimento.

⚠️ **Importante**: Produtos usados **NÃO podem ser devolvidos**.

Para iniciar uma devolução, entre em contato pelo SAC: **0800-123-4567**.

---

*Esta é uma resposta de exemplo gerada pelo modo mock. Configure o webhook n8n para respostas reais.*
  `.trim();

  return {
    answer: mockAnswer,
    synapsesUsed: [
      {
        id: 'mock-synapse-1',
        title: 'Política de Devolução - Prazos Gerais',
        content:
          'Os clientes têm 7 dias corridos para devolução de produtos após recebimento. Para produtos eletrônicos, o prazo é de 15 dias corridos. Produtos com defeito têm garantia de 30 dias corridos.',
        description: 'Regras gerais de devolução e prazos',
        score: 0.94,
        baseConhecimentoId: 'mock-base-1',
      },
      {
        id: 'mock-synapse-2',
        title: 'Garantia de Produtos Eletrônicos',
        content:
          'Produtos eletrônicos possuem prazo de 15 dias para devolução. Em caso de defeito, a garantia é de 30 dias. O produto deve estar na embalagem original.',
        description: 'Políticas específicas para eletrônicos',
        score: 0.87,
        baseConhecimentoId: 'mock-base-1',
      },
      {
        id: 'mock-synapse-3',
        title: 'Produtos Não Devolúveis',
        content:
          'Produtos usados, personalizados ou sem embalagem original NÃO podem ser devolvidos. Exceção apenas para defeitos de fabricação.',
        description: 'Restrições de devolução',
        score: 0.78,
        baseConhecimentoId: 'mock-base-1',
      },
    ],
    processingTime: Math.floor(delay),
  };
}
