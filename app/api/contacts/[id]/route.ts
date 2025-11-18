/**
 * API Route: Contacts by ID
 *
 * GET - Busca dados de um contato
 * PATCH - Atualiza dados de um contato
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getContactById, updateContact } from '@/lib/queries/contacts';
import { z } from 'zod';
import {
  validateCPF,
  validateEmail,
  validatePhone,
} from '@/lib/utils/validators';

// Schema de validação para atualização
const updateContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  phone_secondary: z.string().nullable().optional(),
  address_street: z.string().nullable().optional(),
  address_number: z.string().nullable().optional(),
  address_complement: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
  tenantId: z.string().uuid(),
}).refine(
  (data) => {
    // Validar email se fornecido
    if (data.email && data.email.trim()) {
      return validateEmail(data.email);
    }
    return true;
  },
  { message: 'Email inválido', path: ['email'] }
).refine(
  (data) => {
    // Validar CPF se fornecido
    if (data.cpf && data.cpf.trim()) {
      return validateCPF(data.cpf);
    }
    return true;
  },
  { message: 'CPF inválido', path: ['cpf'] }
).refine(
  (data) => {
    // Validar telefone secundário se fornecido
    if (data.phone_secondary && data.phone_secondary.trim()) {
      return validatePhone(data.phone_secondary);
    }
    return true;
  },
  { message: 'Telefone inválido', path: ['phone_secondary'] }
);

/**
 * GET /api/contacts/[id]
 * Busca dados de um contato
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const contactId = params.id;

    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Buscar tenantId do query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Validar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const userTenantId = (userData as { tenant_id?: string })?.tenant_id;

    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Buscar contato
    const contact = await getContactById(contactId, tenantId);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: contact });

  } catch (error) {
    console.error('Error in GET /api/contacts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * Atualiza dados de um contato
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const contactId = params.id;

    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar payload
    const body = await request.json();
    const result = updateContactSchema.safeParse(body);

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

    // 4. Atualizar contato
    const updatedContact = await updateContact(
      contactId,
      tenantId,
      payload,
      user.id
    );

    if (!updatedContact) {
      return NextResponse.json(
        { error: 'Erro ao atualizar contato' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedContact,
    });

  } catch (error) {
    console.error('Error in PATCH /api/contacts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
