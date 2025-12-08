export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_prompts: {
        Row: {
          id: string
          id_agent: string
          id_tenant: string | null
          // Campos de personalidade (TEXT/ENUM)
          name: string | null
          age: string | null
          gender: Database["public"]["Enums"]["agent_gender_enum"] | null
          objective: string | null
          comunication: string | null
          personality: string | null
          // Campos JSONB
          limitations: Json | null
          instructions: Json | null
          guide_line: Json | null
          rules: Json | null
          others_instructions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          id_agent: string
          id_tenant?: string | null
          name?: string | null
          age?: string | null
          gender?: Database["public"]["Enums"]["agent_gender_enum"] | null
          objective?: string | null
          comunication?: string | null
          personality?: string | null
          limitations?: Json | null
          instructions?: Json | null
          guide_line?: Json | null
          rules?: Json | null
          others_instructions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          id_agent?: string
          id_tenant?: string | null
          name?: string | null
          age?: string | null
          gender?: Database["public"]["Enums"]["agent_gender_enum"] | null
          objective?: string | null
          comunication?: string | null
          personality?: string | null
          limitations?: Json | null
          instructions?: Json | null
          guide_line?: Json | null
          rules?: Json | null
          others_instructions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompts_id_agent_fkey"
            columns: ["id_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          id: string
          name: string
          type: string
          reactive: boolean
          limitations: Json | null
          instructions: Json | null
          guide_line: Json | null
          persona_name: string | null
          age: string | null
          gender: string | null
          objective: string | null
          communication: string | null
          personality: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          reactive?: boolean
          limitations?: Json | null
          instructions?: Json | null
          guide_line?: Json | null
          persona_name?: string | null
          age?: string | null
          gender?: string | null
          objective?: string | null
          communication?: string | null
          personality?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          reactive?: boolean
          limitations?: Json | null
          instructions?: Json | null
          guide_line?: Json | null
          persona_name?: string | null
          age?: string | null
          gender?: string | null
          objective?: string | null
          communication?: string | null
          personality?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          associated_neurocores: string[]
          communication_medium: string | null
          conversation_roteiro: Json
          created_at: string
          function: Database["public"]["Enums"]["agent_function_enum"]
          gender: Database["public"]["Enums"]["agent_gender_enum"] | null
          id: string
          instructions: Json
          is_intent_agent: boolean
          limitations: Json
          name: string
          objective: string | null
          other_instructions: Json
          persona: string | null
          personality_tone: string | null
          template_id: string | null
          type: Database["public"]["Enums"]["agent_type_enum"]
          updated_at: string
        }
        Insert: {
          associated_neurocores?: string[]
          communication_medium?: string | null
          conversation_roteiro?: Json
          created_at?: string
          function: Database["public"]["Enums"]["agent_function_enum"]
          gender?: Database["public"]["Enums"]["agent_gender_enum"] | null
          id?: string
          instructions?: Json
          is_intent_agent?: boolean
          limitations?: Json
          name: string
          objective?: string | null
          other_instructions?: Json
          persona?: string | null
          personality_tone?: string | null
          template_id?: string | null
          type: Database["public"]["Enums"]["agent_type_enum"]
          updated_at?: string
        }
        Update: {
          associated_neurocores?: string[]
          communication_medium?: string | null
          conversation_roteiro?: Json
          created_at?: string
          function?: Database["public"]["Enums"]["agent_function_enum"]
          gender?: Database["public"]["Enums"]["agent_gender_enum"] | null
          id?: string
          instructions?: Json
          is_intent_agent?: boolean
          limitations?: Json
          name?: string
          objective?: string | null
          other_instructions?: Json
          persona?: string | null
          personality_tone?: string | null
          template_id?: string | null
          type?: Database["public"]["Enums"]["agent_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      base_conhecimentos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          neurocore_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          neurocore_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          neurocore_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_conhecimentos_neurocore_id_fkey"
            columns: ["neurocore_id"]
            isOneToOne: false
            referencedRelation: "neurocores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_conhecimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_providers: {
        Row: {
          api_base_config: Json | null
          channel_provider_identifier_code: string | null
          created_at: string
          description: string | null
          id: string
          id_subwork_n8n_master_integrator: string | null
          name: string
          updated_at: string
        }
        Insert: {
          api_base_config?: Json | null
          channel_provider_identifier_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          id_subwork_n8n_master_integrator?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          api_base_config?: Json | null
          channel_provider_identifier_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          id_subwork_n8n_master_integrator?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_provider_id: string
          config_json: Json | null
          created_at: string
          external_api_url: string | null
          id: string
          identification_channel_client_descriptions: string | null
          identification_number: string
          instance_company_name: string | null
          is_active: boolean
          is_receiving_messages: boolean
          is_sending_messages: boolean
          message_wait_time_fragments: number | null
          name: string
          observations: string | null
          provider_external_channel_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_provider_id: string
          config_json?: Json | null
          created_at?: string
          external_api_url?: string | null
          id?: string
          identification_channel_client_descriptions?: string | null
          identification_number: string
          instance_company_name?: string | null
          is_active?: boolean
          is_receiving_messages?: boolean
          is_sending_messages?: boolean
          message_wait_time_fragments?: number | null
          name: string
          observations?: string | null
          provider_external_channel_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel_provider_id?: string
          config_json?: Json | null
          created_at?: string
          external_api_url?: string | null
          id?: string
          identification_channel_client_descriptions?: string | null
          identification_number?: string
          instance_company_name?: string | null
          is_active?: boolean
          is_receiving_messages?: boolean
          is_sending_messages?: boolean
          message_wait_time_fragments?: number | null
          name?: string
          observations?: string | null
          provider_external_channel_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_channel_provider_id_fkey"
            columns: ["channel_provider_id"]
            isOneToOne: false
            referencedRelation: "channel_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_complement: string | null
          address_number: string | null
          address_street: string | null
          city: string | null
          country: string | null
          cpf: string | null
          created_at: string
          customer_data_extracted: Json | null
          email: string | null
          external_contact_id: string | null
          external_identification_contact: string | null
          id: string
          last_interaction_at: string
          last_negotiation: Json | null
          name: string
          phone: string
          phone_secondary: string | null
          rg: string | null
          status: Database["public"]["Enums"]["contact_status_enum"]
          tags: string[] | null
          tenant_id: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          customer_data_extracted?: Json | null
          email?: string | null
          external_contact_id?: string | null
          external_identification_contact?: string | null
          id?: string
          last_interaction_at?: string
          last_negotiation?: Json | null
          name: string
          phone: string
          phone_secondary?: string | null
          rg?: string | null
          status: Database["public"]["Enums"]["contact_status_enum"]
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          city?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          customer_data_extracted?: Json | null
          email?: string | null
          external_contact_id?: string | null
          external_identification_contact?: string | null
          id?: string
          last_interaction_at?: string
          last_negotiation?: Json | null
          name?: string
          phone?: string
          phone_secondary?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["contact_status_enum"]
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reactivations_settings: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean
          max_reactivations: number
          reactivation_time_1_minutes: number | null
          reactivation_time_2_minutes: number | null
          reactivation_time_3_minutes: number | null
          reactivation_time_4_minutes: number | null
          reactivation_time_5_minutes: number | null
          start_time: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          max_reactivations?: number
          reactivation_time_1_minutes?: number | null
          reactivation_time_2_minutes?: number | null
          reactivation_time_3_minutes?: number | null
          reactivation_time_4_minutes?: number | null
          reactivation_time_5_minutes?: number | null
          start_time?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          max_reactivations?: number
          reactivation_time_1_minutes?: number | null
          reactivation_time_2_minutes?: number | null
          reactivation_time_3_minutes?: number | null
          reactivation_time_4_minutes?: number | null
          reactivation_time_5_minutes?: number | null
          start_time?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reactivations_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reasons_pauses_and_closures: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          neurocore_id: string
          reason_type: Database["public"]["Enums"]["reason_type_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          neurocore_id: string
          reason_type: Database["public"]["Enums"]["reason_type_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          neurocore_id?: string
          reason_type?: Database["public"]["Enums"]["reason_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reasons_pauses_and_closures_neurocore_id_fkey"
            columns: ["neurocore_id"]
            isOneToOne: false
            referencedRelation: "neurocores"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel_id: string | null
          closure_notes: string | null
          contact_id: string
          conversation_closure_reason_id: string | null
          conversation_pause_reason_id: string | null
          created_at: string
          external_id: string | null
          ia_active: boolean
          id: string
          last_message_at: string
          overall_feedback_text: string | null
          overall_feedback_type:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          pause_notes: string | null
          status: Database["public"]["Enums"]["conversation_status_enum"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          closure_notes?: string | null
          contact_id: string
          conversation_closure_reason_id?: string | null
          conversation_pause_reason_id?: string | null
          created_at?: string
          external_id?: string | null
          ia_active?: boolean
          id?: string
          last_message_at?: string
          overall_feedback_text?: string | null
          overall_feedback_type?:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          pause_notes?: string | null
          status: Database["public"]["Enums"]["conversation_status_enum"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          closure_notes?: string | null
          contact_id?: string
          conversation_closure_reason_id?: string | null
          conversation_pause_reason_id?: string | null
          created_at?: string
          external_id?: string | null
          ia_active?: boolean
          id?: string
          last_message_at?: string
          overall_feedback_text?: string | null
          overall_feedback_type?:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          pause_notes?: string | null
          status?: Database["public"]["Enums"]["conversation_status_enum"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_conversation_closure_reason_id_fkey"
            columns: ["conversation_closure_reason_id"]
            isOneToOne: false
            referencedRelation: "conversation_reasons_pauses_and_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_conversation_pause_reason_id_fkey"
            columns: ["conversation_pause_reason_id"]
            isOneToOne: false
            referencedRelation: "conversation_reasons_pauses_and_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_modules: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          conversation_id: string
          created_at: string
          feedback_status: Database["public"]["Enums"]["feedback_process_status_enum"]
          feedback_text: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type_enum"]
          id: string
          message_id: string | null
          super_admin_comment: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          feedback_status?: Database["public"]["Enums"]["feedback_process_status_enum"]
          feedback_text?: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type_enum"]
          id?: string
          message_id?: string | null
          super_admin_comment?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          feedback_status?: Database["public"]["Enums"]["feedback_process_status_enum"]
          feedback_text?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type_enum"]
          id?: string
          message_id?: string | null
          super_admin_comment?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          external_message_id: string | null
          feedback_text: string | null
          feedback_type:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          id: string
          sender_agent_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          sender_user_id: string | null
          timestamp: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          external_message_id?: string | null
          feedback_text?: string | null
          feedback_type?:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          id?: string
          sender_agent_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          sender_user_id?: string | null
          timestamp?: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          external_message_id?: string | null
          feedback_text?: string | null
          feedback_type?:
            | Database["public"]["Enums"]["feedback_type_enum"]
            | null
          id?: string
          sender_agent_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          sender_user_id?: string | null
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_agent_id_fkey"
            columns: ["sender_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      neurocores: {
        Row: {
          associated_agents: string[]
          created_at: string
          description: string | null
          id: string
          id_subwork_n8n_neurocore: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          associated_agents?: string[]
          created_at?: string
          description?: string | null
          id?: string
          id_subwork_n8n_neurocore: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          associated_agents?: string[]
          created_at?: string
          description?: string | null
          id?: string
          id_subwork_n8n_neurocore?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      niches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quick_reply_templates: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          message: string
          tenant_id: string
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          message: string
          tenant_id: string
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          message?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      synapses: {
        Row: {
          base_conhecimento_id: string
          content: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_enabled: boolean
          status: Database["public"]["Enums"]["synapse_status_enum"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          base_conhecimento_id: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          status: Database["public"]["Enums"]["synapse_status_enum"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          base_conhecimento_id?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          status?: Database["public"]["Enums"]["synapse_status_enum"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "synapses_base_conhecimento_id_fkey"
            columns: ["base_conhecimento_id"]
            isOneToOne: false
            referencedRelation: "base_conhecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "synapses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          is_active: boolean
          master_integration_active: boolean
          master_integration_url: string | null
          name: string
          neurocore_id: string
          niche_id: string | null
          phone: string
          plan: string
          responsible_finance_email: string
          responsible_finance_name: string
          responsible_finance_whatsapp: string
          responsible_tech_email: string
          responsible_tech_name: string
          responsible_tech_whatsapp: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          is_active?: boolean
          master_integration_active?: boolean
          master_integration_url?: string | null
          name: string
          neurocore_id: string
          niche_id?: string | null
          phone: string
          plan: string
          responsible_finance_email: string
          responsible_finance_name: string
          responsible_finance_whatsapp: string
          responsible_tech_email: string
          responsible_tech_name: string
          responsible_tech_whatsapp: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          is_active?: boolean
          master_integration_active?: boolean
          master_integration_url?: string | null
          name?: string
          neurocore_id?: string
          niche_id?: string | null
          phone?: string
          plan?: string
          responsible_finance_email?: string
          responsible_finance_name?: string
          responsible_finance_whatsapp?: string
          responsible_tech_email?: string
          responsible_tech_name?: string
          responsible_tech_whatsapp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_neurocore_id_fkey"
            columns: ["neurocore_id"]
            isOneToOne: false
            referencedRelation: "neurocores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_sign_in_at: string | null
          modules: string[]
          role: Database["public"]["Enums"]["access_user_role"]
          tenant_id: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_sign_in_at?: string | null
          modules?: string[]
          role?: Database["public"]["Enums"]["access_user_role"]
          tenant_id?: string | null
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          modules?: string[]
          role?: Database["public"]["Enums"]["access_user_role"]
          tenant_id?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      access_user_role: "super_admin" | "user"
      agent_function_enum: "support" | "sales" | "after_sales" | "research"
      agent_gender_enum: "male" | "female"
      agent_type_enum: "attendant" | "intention" | "observer" | "in_guard_rails"
      contact_status_enum: "open" | "with_ai" | "paused" | "closed"
      conversation_status_enum: "open" | "paused" | "closed"
      feedback_process_status_enum: "open" | "in_progress" | "closed"
      feedback_type_enum: "like" | "dislike"
      message_sender_type_enum: "customer" | "attendant" | "ai"
      reason_type_enum: "pause" | "closure"
      synapse_status_enum: "draft" | "indexing" | "publishing" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_user_role: ["super_admin", "user"],
      agent_function_enum: ["support", "sales", "after_sales", "research"],
      agent_gender_enum: ["male", "female"],
      agent_type_enum: ["attendant", "intention", "observer", "in_guard_rails"],
      contact_status_enum: ["open", "with_ai", "paused", "closed"],
      conversation_status_enum: ["open", "paused", "closed"],
      feedback_process_status_enum: ["open", "in_progress", "closed"],
      feedback_type_enum: ["like", "dislike"],
      message_sender_type_enum: ["customer", "attendant", "ai"],
      reason_type_enum: ["pause", "closure"],
      synapse_status_enum: ["draft", "indexing", "publishing", "error"],
    },
  },
} as const

// Convenience type exports
export type Message = Tables<'messages'>
export type Conversation = Tables<'conversations'>
export type Contact = Tables<'contacts'>
export type User = Tables<'users'>
export type QuickReplyTemplate = Tables<'quick_reply_templates'>
export type ConversationStatus = Enums<'conversation_status_enum'>
export type MessageSenderType = Enums<'message_sender_type_enum'>

// CRM types (tags table structure from database)
export interface Tag {
  id: string
  created_at: string
  tag_name: string
  id_tenant: string
  prompt_to_ai: Json | null
  active: boolean
  order_index?: number
  color?: string
}

// CRM types (conversation_tags table)
export interface ConversationTag {
  id: string
  conversation_id: string
  tag_id: string
  created_at: string
}

