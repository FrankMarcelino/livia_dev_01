# Supabase Reference

Guia completo para trabalhar com Supabase no projeto LIVIA.

## Setup de Clientes

### Server Component/API Route
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Client Component
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## Queries

### Server Component (Recomendado)
```typescript
// app/contacts/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Contact } from '@/types/database';

export default async function ContactsPage() {
  const supabase = await createClient();

  // Buscar usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Query com RLS automático
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      *,
      conversations (
        id,
        last_message_at,
        unread_count
      )
    `)
    .eq('tenant_id', user.user_metadata.tenant_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return <div>Error loading contacts</div>;
  }

  return <ContactsList contacts={contacts} />;
}
```

### Client Component com useState
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact } from '@/types/database';

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) {
        console.error(error);
      } else {
        setContacts(data);
      }

      setLoading(false);
    };

    fetchContacts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>{/* Renderizar contacts */}</div>;
}
```

### Custom Hook (Melhor Prática)
```typescript
// hooks/use-contacts.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact } from '@/types/database';

export function useContacts(tenantId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');

        if (error) throw error;

        setContacts(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [tenantId]);

  return { contacts, loading, error };
}

// Uso:
// const { contacts, loading, error } = useContacts(tenantId);
```

## Realtime Subscriptions

### Escutar Novos Registros
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types/database';

export function MessagesList({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Buscar mensagens iniciais
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscrever a novos inserts
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Escutar Múltiplos Eventos
```typescript
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Novo insert
        setMessages((current) => [...current, payload.new as Message]);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Update
        setMessages((current) =>
          current.map((msg) =>
            msg.id === payload.new.id ? (payload.new as Message) : msg
          )
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Delete
        setMessages((current) =>
          current.filter((msg) => msg.id !== payload.old.id)
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);
```

### Presence (Usuários Online)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function OnlineUsers({ conversationId }: { conversationId: string }) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: {
        presence: {
          key: 'user-id',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.values(state).flat());
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: 'user-123',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return <div>{onlineUsers.length} usuários online</div>;
}
```

## Autenticação

### Verificar Usuário (Server)
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // user.id, user.email, user.user_metadata disponíveis
  return <div>Welcome {user.email}</div>;
}
```

### Login
```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return;
    }

    router.push('/dashboard');
    router.refresh(); // Atualizar Server Components
  };

  return <form onSubmit={handleLogin}>{/* Form fields */}</form>;
}
```

### Logout
```typescript
const handleLogout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/login');
  router.refresh();
};
```

### Middleware para Proteção de Rotas
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Proteger rotas /dashboard/*
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

## Row Level Security (RLS)

### Exemplo de Política RLS
```sql
-- Política: Usuários só veem contatos do próprio tenant
CREATE POLICY "Users can view own tenant contacts"
ON contacts
FOR SELECT
USING (
  tenant_id = (
    SELECT user_metadata->>'tenant_id'
    FROM auth.users
    WHERE id = auth.uid()
  )::uuid
);

-- Política: Usuários só podem inserir no próprio tenant
CREATE POLICY "Users can insert own tenant contacts"
ON contacts
FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT user_metadata->>'tenant_id'
    FROM auth.users
    WHERE id = auth.uid()
  )::uuid
);
```

### Testar RLS no Código
```typescript
// Se RLS estiver configurado corretamente, isso já filtra automaticamente
const { data: contacts } = await supabase
  .from('contacts')
  .select('*');
// Retorna apenas contatos do tenant do usuário autenticado
```

## Tipos TypeScript Gerados

### Gerar tipos do schema
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Usar tipos gerados
```typescript
// types/database.ts (gerado automaticamente)
export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          tenant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          tenant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          tenant_id?: string;
          created_at?: string;
        };
      };
      // Outras tabelas...
    };
  };
};

// Uso:
import { Database } from '@/types/database';

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
```

## Boas Práticas

✅ **FAZER:**
- Usar Server Components sempre que possível (melhor performance)
- Implementar RLS em todas as tabelas
- Validar `tenant_id` em queries multi-tenant
- Limpar subscriptions no cleanup (return)
- Usar tipos TypeScript gerados
- Tratar erros adequadamente
- Usar middleware para proteção de rotas

❌ **NÃO FAZER:**
- Fazer queries sem considerar RLS
- Expor credenciais de service_role no client
- Esquecer de remover channels no cleanup
- Ignorar erros de queries
- Hardcodar tenant_id
- Usar client components desnecessariamente
