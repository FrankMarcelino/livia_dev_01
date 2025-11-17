/**
 * Tipos TypeScript gerados do Schema Supabase - LIVIA MVP
 *
 * IMPORTANTE: Este é um arquivo de exemplo.
 * Na prática, gere os tipos automaticamente com:
 *
 * ```bash
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 * ```
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ReasonType = 'pause' | 'closure';

export type UserRole = 'super_admin' | 'user';

export type AgentType = 'reactive' | 'active';

export type AgentFunction = 'support' | 'sales' | 'after_sales' | 'research';

export type AgentGender = 'male' | 'female';

export type ContactStatus = 'open' | 'with_ai' | 'paused' | 'closed';

export type ConversationStatus = 'open' | 'paused' | 'closed';

export type MessageSenderType = 'customer' | 'attendant' | 'ai' | 'system';

export type FeedbackType = 'like' | 'dislike';

export type SynapseStatus = 'draft' | 'indexing' | 'publishing' | 'error';

export type FeedbackProcessStatus = 'open' | 'in_progress' | 'closed';

// ============================================================================
// TABELAS - TIPOS BASE
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  neurocore_id: string;
  niche_id: string | null;
  is_active: boolean;
  cnpj: string;
  phone: string;
  responsible_tech_name: string;
  responsible_tech_whatsapp: string;
  responsible_tech_email: string;
  responsible_finance_name: string;
  responsible_finance_whatsapp: string;
  responsible_finance_email: string;
  plan: string;
  master_integration_url: string | null;
  master_integration_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // FK auth.users
  tenant_id: string | null;
  full_name: string;
  email: string;
  whatsapp_number: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
  modules: string[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  channel_id: string | null;
  name: string;
  phone: string;
  phone_secondary: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  zip_code: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  cpf: string | null;
  rg: string | null;
  last_interaction_at: string;
  status: ContactStatus;
  customer_data_extracted: Record<string, any> | null;
  tags: string[];
  last_negotiation: Record<string, any> | null;
  external_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  tenant_id: string;
  channel_id: string | null;
  external_id: string | null;
  status: ConversationStatus;
  ia_active: boolean;
  ia_paused_by_user_id: string | null;
  ia_paused_at: string | null;
  ia_pause_reason: string | null;
  last_message_at: string;
  overall_feedback_type: FeedbackType | null;
  overall_feedback_text: string | null;
  conversation_pause_reason_id: string | null;
  pause_notes: string | null;
  conversation_closure_reason_id: string | null;
  closure_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  channel_id: string | null;
  sender_type: MessageSenderType;
  sender_user_id: string | null;
  sender_agent_id: string | null;
  content: string;
  timestamp: string;
  feedback_type: FeedbackType | null;
  feedback_text: string | null;
  external_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationStateHistory {
  id: string;
  conversation_id: string;
  from_status: ConversationStatus | null;
  to_status: ConversationStatus;
  changed_by_user_id: string | null;
  reason_id: string | null;
  notes: string | null;
  ia_active_before: boolean | null;
  ia_active_after: boolean | null;
  created_at: string;
}

export interface BaseConhecimento {
  id: string;
  tenant_id: string;
  neurocore_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Synapse {
  id: string;
  base_conhecimento_id: string;
  tenant_id: string;
  title: string;
  content: string;
  description: string | null;
  image_url: string | null;
  status: SynapseStatus;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SynapseEmbedding {
  id: string;
  synapse_id: string;
  tenant_id: string;
  chunk_index: number;
  chunk_content: string;
  embedding: number[]; // vector(1536)
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  tenant_id: string;
  channel_provider_id: string;
  name: string;
  identification_number: string;
  instance_company_name: string | null;
  is_active: boolean;
  is_receiving_messages: boolean;
  is_sending_messages: boolean;
  observations: string | null;
  external_api_url: string | null;
  provider_external_channel_id: string | null;
  config_json: Record<string, any> | null;
  message_wait_time_fragments: number;
  identification_channel_client_descriptions: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickReplyTemplate {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  category: string | null;
  tags: string[];
  icon: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  tenant_id: string;
  user_id: string;
  conversation_id: string;
  message_id: string | null;
  feedback_type: FeedbackType;
  feedback_text: string | null;
  feedback_status: FeedbackProcessStatus;
  super_admin_comment: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS COMPOSTOS (Models)
// ============================================================================

export interface ContactWithConversations extends Contact {
  conversations: Conversation[];
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  contact: Contact;
}

export interface MessageWithSender extends Message {
  sender_user?: User;
  sender_agent?: Agent;
}

export interface SynapseWithBase extends Synapse {
  base_conhecimento: BaseConhecimento;
}

export interface BaseConhecimentoWithSynapses extends BaseConhecimento {
  synapses: Synapse[];
  published_count: number;
  draft_count: number;
}

// ============================================================================
// TIPOS DE CONFIGURAÇÃO (Super Admin)
// ============================================================================

export interface Neurocore {
  id: string;
  name: string;
  description: string | null;
  id_subwork_n8n_neurocore: string;
  is_active: boolean;
  associated_agents: string[];
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  function: AgentFunction;
  gender: AgentGender | null;
  persona: string | null;
  personality_tone: string | null;
  communication_medium: string | null;
  objective: string | null;
  is_intent_agent: boolean;
  associated_neurocores: string[];
  instructions: Record<string, any>;
  limitations: Record<string, any>;
  conversation_roteiro: Record<string, any>;
  other_instructions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChannelProvider {
  id: string;
  name: string;
  description: string | null;
  channel_provider_identifier_code: string | null;
  id_subwork_n8n_master_integrator: string | null;
  api_base_config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Niche {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureModule {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationReason {
  id: string;
  reason_type: ReasonType;
  neurocore_id: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationReactivationsSettings {
  id: string;
  tenant_id: string;
  is_active: boolean;
  max_reactivations: number;
  reactivation_time_1_minutes: number | null;
  reactivation_time_2_minutes: number | null;
  reactivation_time_3_minutes: number | null;
  reactivation_time_4_minutes: number | null;
  reactivation_time_5_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS DE INSERÇÃO (Para CREATE/UPDATE)
// ============================================================================

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'updated_at'>;
export type SynapseInsert = Omit<Synapse, 'id' | 'created_at' | 'updated_at'>;
export type BaseConhecimentoInsert = Omit<BaseConhecimento, 'id' | 'created_at' | 'updated_at'>;

// ============================================================================
// TIPOS DE ATUALIZAÇÃO (Para UPDATE parcial)
// ============================================================================

export type ContactUpdate = Partial<ContactInsert>;
export type ConversationUpdate = Partial<ConversationInsert>;
export type MessageUpdate = Partial<MessageInsert>;
export type SynapseUpdate = Partial<SynapseInsert>;

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// TIPOS PARA REALTIME
// ============================================================================

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  table: string;
  schema: string;
}

// ============================================================================
// TIPOS PARA WEBHOOKS n8n
// ============================================================================

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  tenantId: string;
  userId: string;
  channelId: string;
}

export interface SyncSynapsePayload {
  synapseId: string;
  action: 'publish' | 'update' | 'disable' | 'enable' | 'delete';
  tenantId: string;
  baseConhecimentoId: string;
  data?: Partial<Synapse>;
}

export interface NeurocoreQueryPayload {
  question: string;
  tenantId: string;
  neurocoreId: string;
  baseConhecimentoIds?: string[];
  maxSynapses?: number;
}

export interface NeurocoreQueryResponse {
  answer: string;
  synapsesUsed: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    chunkContent: string;
  }>;
  processingTime: number;
}

// ============================================================================
// EXPORT TUDO
// ============================================================================

export interface Database {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Tenant, 'id'>> };
      users: { Row: User; Insert: Omit<User, 'created_at' | 'updated_at'>; Update: Partial<Omit<User, 'id'>> };
      contacts: { Row: Contact; Insert: ContactInsert; Update: ContactUpdate };
      conversations: { Row: Conversation; Insert: ConversationInsert; Update: ConversationUpdate };
      messages: { Row: Message; Insert: MessageInsert; Update: MessageUpdate };
      base_conhecimentos: { Row: BaseConhecimento; Insert: BaseConhecimentoInsert; Update: Partial<BaseConhecimentoInsert> };
      synapses: { Row: Synapse; Insert: SynapseInsert; Update: SynapseUpdate };
      synapse_embeddings: { Row: SynapseEmbedding; Insert: Omit<SynapseEmbedding, 'id' | 'created_at' | 'updated_at'>; Update: never };
      // ... outras tabelas
    };
    Enums: {
      reason_type_enum: ReasonType;
      access_user_role: UserRole;
      agent_type_enum: AgentType;
      agent_function_enum: AgentFunction;
      agent_gender_enum: AgentGender;
      contact_status_enum: ContactStatus;
      conversation_status_enum: ConversationStatus;
      message_sender_type_enum: MessageSenderType;
      feedback_type_enum: FeedbackType;
      synapse_status_enum: SynapseStatus;
      feedback_process_status_enum: FeedbackProcessStatus;
    };
  };
}
