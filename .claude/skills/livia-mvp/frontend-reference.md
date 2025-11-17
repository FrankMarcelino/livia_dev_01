# Frontend Reference

Guia completo para desenvolvimento frontend com Next.js 15 e shadcn/ui no projeto LIVIA.

## Next.js 15 App Router

### Server Components (Padrão)
```typescript
// app/contacts/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ContactsList } from '@/components/contacts/contacts-list';

export default async function ContactsPage() {
  // Fetch direto no componente
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*');

  return (
    <div>
      <h1>Contatos</h1>
      <ContactsList contacts={contacts} />
    </div>
  );
}
```

**Vantagens:**
- ✅ Renderização no servidor (SEO melhor)
- ✅ Reduz bundle JavaScript do client
- ✅ Acesso direto a dados (sem API routes)
- ✅ Melhor performance

### Client Components
```typescript
// components/contacts/contact-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do contato"
      />
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

**Usar 'use client' quando:**
- ✅ Usar hooks do React (useState, useEffect, etc.)
- ✅ Event handlers (onClick, onChange, etc.)
- ✅ Browser APIs (localStorage, window, etc.)
- ✅ Context providers
- ✅ Bibliotecas que dependem do client

### Composição Server + Client
```typescript
// app/contacts/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';
import { ContactForm } from '@/components/contacts/contact-form'; // Client
import { ContactsList } from '@/components/contacts/contacts-list'; // Client

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: contacts } = await supabase.from('contacts').select('*');

  // Server Component renderiza Client Components
  return (
    <div>
      <h1>Contatos</h1>
      <ContactForm />
      <ContactsList initialContacts={contacts} />
    </div>
  );
}
```

## Estrutura de Componentes

### Template Base
```typescript
// components/contacts/contact-card.tsx
'use client';

import { Contact } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{contact.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{contact.email}</p>
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <Button onClick={() => onEdit(contact)} variant="outline">
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(contact.id)}
              variant="destructive"
            >
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Componente com Loading State
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function SubmitButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await someAsyncAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Salvando...' : 'Salvar'}
    </Button>
  );
}
```

### Componente com Error Handling
```typescript
'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Ação
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Form fields */}
      <Button type="submit">Enviar</Button>
    </form>
  );
}
```

## shadcn/ui

### Componentes Principais

#### Button
```typescript
import { Button } from '@/components/ui/button';

<Button>Default</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Link</Button>
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button disabled>Desabilitado</Button>
```

#### Input
```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="seu@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

#### Card
```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo do card</p>
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

#### Dialog (Modal)
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar ação</DialogTitle>
      <DialogDescription>
        Tem certeza que deseja continuar?
      </DialogDescription>
    </DialogHeader>
    {/* Conteúdo do dialog */}
  </DialogContent>
</Dialog>
```

#### Select
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
    <SelectItem value="option2">Opção 2</SelectItem>
  </SelectContent>
</Select>
```

#### Toast (Notificações)
```typescript
// Instalar: npx shadcn@latest add sonner
import { toast } from 'sonner';

// Uso:
toast.success('Salvo com sucesso!');
toast.error('Erro ao salvar');
toast.info('Informação');
toast.warning('Atenção');

// Com ação:
toast('Evento criado', {
  action: {
    label: 'Desfazer',
    onClick: () => console.log('Undo'),
  },
});
```

#### Table
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {contacts.map((contact) => (
      <TableRow key={contact.id}>
        <TableCell>{contact.name}</TableCell>
        <TableCell>{contact.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Adicionar Novos Componentes
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add sonner  # Toast notifications
```

## Routing e Navegação

### Estrutura de Rotas
```
app/
├── (auth)/              # Route group (não afeta URL)
│   ├── login/
│   │   └── page.tsx    # /login
│   └── signup/
│       └── page.tsx    # /signup
├── (dashboard)/
│   ├── contacts/
│   │   ├── page.tsx           # /contacts
│   │   └── [id]/
│   │       └── page.tsx       # /contacts/[id]
│   ├── conversations/
│   │   └── page.tsx           # /conversations
│   └── layout.tsx      # Layout compartilhado
└── layout.tsx          # Root layout
```

### Links
```typescript
import Link from 'next/link';

<Link href="/contacts">Ver Contatos</Link>
<Link href={`/contacts/${contact.id}`}>Detalhes</Link>
```

### Navegação Programática
```typescript
'use client';

import { useRouter } from 'next/navigation';

export function Component() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/contacts');
    // router.back();
    // router.refresh(); // Revalidar Server Components
  };

  return <Button onClick={handleClick}>Ir</Button>;
}
```

### Params Dinâmicos
```typescript
// app/contacts/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  return <div>{contact.name}</div>;
}
```

### Search Params
```typescript
// app/contacts/page.tsx?search=john
interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const { search } = await searchParams;

  // Usar search para filtrar
  return <div>Buscando por: {search}</div>;
}
```

## Loading & Error States

### Loading UI
```typescript
// app/contacts/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
```

### Error UI
```typescript
// app/contacts/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <p>{error.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
```

### Not Found
```typescript
// app/contacts/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Contato não encontrado</h2>
      <Link href="/contacts">Voltar</Link>
    </div>
  );
}

// Uso no page.tsx:
import { notFound } from 'next/navigation';

if (!contact) {
  notFound();
}
```

## Streaming com Suspense
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

async function RecentContacts() {
  const { data } = await supabase.from('contacts').select('*').limit(5);
  return <ContactsList contacts={data} />;
}

async function Stats() {
  const { count } = await supabase.from('contacts').select('*', { count: 'exact' });
  return <div>Total: {count}</div>;
}

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<div>Carregando stats...</div>}>
        <Stats />
      </Suspense>

      <Suspense fallback={<div>Carregando contatos...</div>}>
        <RecentContacts />
      </Suspense>
    </div>
  );
}
```

## Formulários com Server Actions

```typescript
// app/contacts/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const { error } = await supabase
    .from('contacts')
    .insert({ name, email });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/contacts');
  return { success: true };
}

// components/contact-form.tsx
import { createContact } from '@/app/contacts/actions';

export function ContactForm() {
  return (
    <form action={createContact}>
      <Input name="name" required />
      <Input name="email" type="email" required />
      <Button type="submit">Criar</Button>
    </form>
  );
}
```

## Boas Práticas

✅ **FAZER:**
- Usar Server Components por padrão
- Client Components apenas quando necessário
- Componentes pequenos e focados (SRP)
- Separar lógica de apresentação
- Usar shadcn/ui para consistência
- Implementar loading e error states
- Usar TypeScript para props
- Seguir convenções de nomenclatura

❌ **NÃO FAZER:**
- Usar 'use client' desnecessariamente
- Criar componentes gigantes
- Misturar lógica de negócio com UI
- Ignorar estados de loading/error
- Criar componentes custom quando shadcn tem equivalente
- Esquecer de tipar props
