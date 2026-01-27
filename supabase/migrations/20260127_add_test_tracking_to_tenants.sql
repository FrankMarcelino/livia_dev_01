-- Migration: Add test tracking fields to tenants table
-- Purpose: Track billing/usage for knowledge base validation tests
-- Created: 2026-01-27

-- Add columns for test tracking (IF NOT EXISTS para idempotência)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS id_contato_testes uuid REFERENCES public.contacts(id),
ADD COLUMN IF NOT EXISTS id_conversas_testes uuid REFERENCES public.conversations(id);

-- Add comments for documentation
COMMENT ON COLUMN public.tenants.id_contato_testes IS 'Contact used to track billing costs for knowledge base validation tests';
COMMENT ON COLUMN public.tenants.id_conversas_testes IS 'Conversation used to track billing costs for knowledge base validation tests';

-- Populate test contacts and conversations for existing tenants
DO $$
DECLARE
    tenant_record RECORD;
    new_contact_id uuid;
    new_conversation_id uuid;
    first_channel_id uuid;
BEGIN
    -- Loop through all existing tenants
    FOR tenant_record IN 
        SELECT id, name 
        FROM public.tenants 
        WHERE id_contato_testes IS NULL OR id_conversas_testes IS NULL
    LOOP
        -- Create test contact for this tenant
        INSERT INTO public.contacts (
            id,
            tenant_id,
            name,
            phone,
            status,
            last_interaction_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            tenant_record.id,
            '[TESTE] Validação Base Conhecimento',
            '+5500000000000',
            'open',
            now(),
            now(),
            now()
        ) RETURNING id INTO new_contact_id;

        -- Get first channel for this tenant (if exists)
        SELECT id INTO first_channel_id
        FROM public.channels
        WHERE tenant_id = tenant_record.id
        AND is_active = true
        LIMIT 1;

        -- Create test conversation for this tenant
        INSERT INTO public.conversations (
            id,
            contact_id,
            tenant_id,
            channel_id,
            status,
            ia_active,
            last_message_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_contact_id,
            tenant_record.id,
            first_channel_id, -- Can be NULL if no channel exists
            'open',
            false, -- IA desativada para conversas de teste
            now(),
            now(),
            now()
        ) RETURNING id INTO new_conversation_id;

        -- Update tenant with test IDs
        UPDATE public.tenants
        SET 
            id_contato_testes = new_contact_id,
            id_conversas_testes = new_conversation_id
        WHERE id = tenant_record.id;

        RAISE NOTICE 'Created test contact and conversation for tenant: % (ID: %)', tenant_record.name, tenant_record.id;
    END LOOP;
END $$;

-- Criar função para popular campos de teste automaticamente
CREATE OR REPLACE FUNCTION public.create_test_contact_and_conversation()
RETURNS TRIGGER AS $$
DECLARE
    new_contact_id uuid;
    new_conversation_id uuid;
    first_channel_id uuid;
BEGIN
    -- Só executa se os campos ainda não foram preenchidos
    IF NEW.id_contato_testes IS NULL OR NEW.id_conversas_testes IS NULL THEN
        -- Create test contact
        INSERT INTO public.contacts (
            id,
            tenant_id,
            name,
            phone,
            status,
            last_interaction_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            '[TESTE] Validação Base Conhecimento',
            '+5500000000000',
            'open',
            now(),
            now(),
            now()
        ) RETURNING id INTO new_contact_id;

        -- Get first channel for this tenant (if exists)
        SELECT id INTO first_channel_id
        FROM public.channels
        WHERE tenant_id = NEW.id
        AND is_active = true
        LIMIT 1;

        -- Create test conversation
        INSERT INTO public.conversations (
            id,
            contact_id,
            tenant_id,
            channel_id,
            status,
            ia_active,
            last_message_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_contact_id,
            NEW.id,
            first_channel_id,
            'open',
            false,
            now(),
            now(),
            now()
        ) RETURNING id INTO new_conversation_id;

        -- Update tenant with test IDs
        NEW.id_contato_testes := new_contact_id;
        NEW.id_conversas_testes := new_conversation_id;

        RAISE NOTICE 'Auto-created test contact and conversation for new tenant: %', NEW.name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_create_test_records ON public.tenants;
CREATE TRIGGER trigger_create_test_records
    BEFORE INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.create_test_contact_and_conversation();