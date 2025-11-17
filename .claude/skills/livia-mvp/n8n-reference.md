# n8n Integration Reference

Guia completo para integração com n8n no projeto LIVIA.

## Arquitetura de Integração

```
Client Component
    ↓
API Route (/app/api/n8n/*)
    ↓
n8n Webhook
    ↓
Workflow n8n (IA, processamento)
    ↓
Response
```

**REGRA DE OURO:** NUNCA expor URLs de webhooks n8n diretamente no client.

## Webhooks n8n Disponíveis

### 1. Dados Iniciais
```
URL: /webhook/e62fac38-...
Método: GET/POST
Uso: Buscar dados iniciais de configuração
```

### 2. Listar Mensagens
```
URL: /webhook/live_chat_messages
Método: POST
Payload: { conversationId: string, tenantId: string }
Response: Message[]
```

### 3. Enviar Mensagem
```
URL: /webhook/send_message
Método: POST
Payload: {
  conversationId: string,
  content: string,
  tenantId: string,
  userId: string
}
Response: { success: boolean, messageId: string }
```

### 4. Quick Reply
```
URL: /webhook/usage_quick_message
Método: POST
Payload: {
  conversationId: string,
  quickReplyId: string,
  tenantId: string
}
Response: { success: boolean }
```

## Padrão de Implementação

### 1. Criar API Route

**Estrutura:**
```
app/api/n8n/
├── send-message/
│   └── route.ts
├── quick-reply/
│   └── route.ts
└── list-messages/
    └── route.ts
```

**Template de API Route:**
```typescript
// app/api/n8n/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const N8N_WEBHOOK_URL = process.env.N8N_SEND_MESSAGE_WEBHOOK!;

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar payload
    const body = await request.json();
    const { conversationId, content, tenantId } = body;

    if (!conversationId || !content || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Validar tenant_id (segurança)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 403 }
      );
    }

    // 4. Chamar webhook n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        content,
        tenantId,
        userId: user.id,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json();

    // 5. Retornar resposta
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Configurar Variáveis de Ambiente

```env
# .env.local
N8N_SEND_MESSAGE_WEBHOOK=https://n8n.example.com/webhook/send_message
N8N_LIST_MESSAGES_WEBHOOK=https://n8n.example.com/webhook/live_chat_messages
N8N_QUICK_REPLY_WEBHOOK=https://n8n.example.com/webhook/usage_quick_message
N8N_INITIAL_DATA_WEBHOOK=https://n8n.example.com/webhook/e62fac38-...
```

### 3. Chamar do Client

```typescript
// components/messages/send-message-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SendMessageFormProps {
  conversationId: string;
  tenantId: string;
}

export function SendMessageForm({ conversationId, tenantId }: SendMessageFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/n8n/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setContent('');
      // Sucesso - mensagem será recebida via Realtime

    } catch (error) {
      console.error('Error sending message:', error);
      // Mostrar erro ao usuário
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Digite sua mensagem..."
        disabled={loading}
      />
      <Button onClick={handleSend} disabled={loading || !content}>
        {loading ? 'Enviando...' : 'Enviar'}
      </Button>
    </div>
  );
}
```

## Tratamento de Erros

### Erros Comuns

1. **401 Unauthorized**
   - Usuário não autenticado
   - Token expirado

2. **403 Forbidden**
   - tenant_id inválido
   - Usuário sem permissão

3. **400 Bad Request**
   - Payload inválido
   - Campos obrigatórios faltando

4. **500 Internal Server Error**
   - Webhook n8n offline
   - Timeout na resposta

### Exemplo com Toast

```typescript
import { toast } from 'sonner';

try {
  const response = await fetch('/api/n8n/send-message', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao enviar mensagem');
  }

  toast.success('Mensagem enviada com sucesso!');

} catch (error) {
  toast.error(error.message || 'Erro inesperado');
}
```

## Timeouts e Retry

Para operações longas (IA processando):

```typescript
// app/api/n8n/ai-process/route.ts
export const maxDuration = 60; // 60 segundos (Vercel Pro)

export async function POST(request: NextRequest) {
  // Webhook pode demorar até 60s para responder
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // Processar resposta...

  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    throw error;
  }
}
```

## Webhooks com Server-Sent Events (SSE)

Para streaming de IA:

```typescript
// app/api/n8n/ai-stream/route.ts
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          body: JSON.stringify(data),
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          controller.enqueue(value);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Boas Práticas

✅ **FAZER:**
- Sempre validar autenticação
- Validar tenant_id para multi-tenancy
- Usar variáveis de ambiente para URLs
- Implementar timeout e retry
- Logar erros adequadamente
- Retornar status HTTP corretos

❌ **NÃO FAZER:**
- Expor webhooks no client
- Hardcodar URLs de webhooks
- Ignorar erros de autenticação
- Fazer chamadas sem timeout
- Retornar mensagens de erro técnicas ao usuário
